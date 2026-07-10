'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { ChatPanel } from '@/components/ChatPanel';

type Save = 'idle' | 'saving' | 'saved';

export function EditorClient({ id }: { id: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [name, setName] = useState('Diagrama');
  const [save, setSave] = useState<Save>('idle');
  const [chatOpen, setChatOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const docRef = useRef<any>(null); // last known doc
  const readyRef = useRef(false); // iframe embed bridge ready
  const saveTimer = useRef<any>(null);
  const getResolvers = useRef<((doc: any) => void)[]>([]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const post = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, origin);
  }, [origin]);

  const sendLoad = useCallback(() => {
    if (readyRef.current && docRef.current) post({ type: 'archstudio:load', doc: docRef.current });
  }, [post]);

  // load project
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await api<any>('/projects/' + id);
        if (!alive) return;
        setName(p.name || 'Diagrama');
        docRef.current = p.doc && p.doc.format ? p.doc : { format: 'archstudio', version: 3, state: p.doc?.state };
        setLoaded(true);
        sendLoad();
      } catch (e) {
        // if it fails, leave canvas empty
        setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, sendLoad]);

  // bridge messages from the canvas iframe
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (ev.origin !== origin) return;
      const m = ev.data || {};
      if (m.type === 'archstudio:ready') {
        readyRef.current = true;
        sendLoad();
      } else if (m.type === 'archstudio:change' && m.doc) {
        docRef.current = m.doc;
        scheduleSave(m.doc);
      } else if (m.type === 'archstudio:doc') {
        docRef.current = m.doc;
        const rs = getResolvers.current;
        getResolvers.current = [];
        rs.forEach((r) => r(m.doc));
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, sendLoad]);

  function scheduleSave(doc: any) {
    setSave('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await api('/projects/' + id, { method: 'PUT', body: { doc } });
        setSave('saved');
      } catch {
        setSave('idle');
      }
    }, 800);
  }

  function getDoc(): Promise<any> {
    return new Promise((resolve) => {
      if (!readyRef.current) return resolve(docRef.current || {});
      getResolvers.current.push(resolve);
      post({ type: 'archstudio:get' });
      setTimeout(() => resolve(docRef.current || {}), 1200);
    });
  }

  function applySpec(spec: any) {
    post({ type: 'archstudio:apply', spec });
  }

  async function saveName() {
    try {
      await api('/projects/' + id, { method: 'PUT', body: { name } });
    } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-panel px-4 py-2">
        <Link href="/app" className="text-sm text-dim hover:text-ink">
          ← Projetos
        </Link>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold hover:border-border focus:border-accent focus:outline-none"
        />
        <span className="text-xs text-dim">
          {save === 'saving' ? 'salvando…' : save === 'saved' ? '✓ salvo' : ''}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="rounded-lg border border-border bg-panel2 px-3 py-1.5 text-sm text-ink hover:border-accent"
        >
          {chatOpen ? 'Ocultar IA' : '🤖 Assistente'}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          src="/canvas/index.html?embed=1"
          className="h-full min-w-0 flex-1 border-0 bg-bg"
          onLoad={() => sendLoad()}
          title="ArchStudio canvas"
        />
        {chatOpen && (
          <div className="h-full w-[380px] shrink-0 border-l border-border bg-panel">
            <ChatPanel getDoc={getDoc} onApplySpec={applySpec} />
          </div>
        )}
      </div>
    </div>
  );
}
