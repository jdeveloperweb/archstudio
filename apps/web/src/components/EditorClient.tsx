'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { ChatPanel } from '@/components/ChatPanel';
import { Mark } from '@/components/Brand';

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

  // tema do app → canvas só entende claro/escuro (meia-noite conta como escuro)
  const canvasTheme = () =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme ? 'dark' : 'light';
  const [initialTheme] = useState(canvasTheme);

  const post = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, origin);
  }, [origin]);

  const sendLoad = useCallback(() => {
    if (!readyRef.current) return;
    post({ type: 'archstudio:theme', theme: canvasTheme() });
    if (docRef.current) post({ type: 'archstudio:load', doc: docRef.current });
  }, [post]);

  // repassa a troca de tema do app para o canvas embutido
  useEffect(() => {
    const obs = new MutationObserver(() => post({ type: 'archstudio:theme', theme: canvasTheme() }));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
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
      <div className="flex items-center gap-3 border-b border-border/80 bg-panel/80 px-4 py-2 backdrop-blur-md sm:px-6">
        <Link
          href="/app"
          className="btn-focus rounded-lg px-2 py-1 font-mono text-xs text-dim transition hover:text-ink"
        >
          ← projetos
        </Link>
        <span className="h-4 w-px bg-border" aria-hidden />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          aria-label="Nome do diagrama"
          className="btn-focus rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold transition hover:border-border focus:border-accent focus:outline-none"
        />
        <span
          className={`flex items-center gap-1.5 font-mono text-xs transition ${
            save === 'saving' ? 'text-aws' : save === 'saved' ? 'text-sless' : 'text-transparent'
          }`}
          aria-live="polite"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${save === 'saving' ? 'animate-caret bg-aws' : 'bg-sless'}`} />
          {save === 'saving' ? 'salvando…' : 'salvo'}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => setChatOpen((v) => !v)}
          className={`btn-focus flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
            chatOpen
              ? 'border-accent/50 bg-accent/15 text-ink'
              : 'border-border bg-panel2 text-ink hover:border-accent/60'
          }`}
        >
          <Mark size={14} />
          {chatOpen ? 'Ocultar assistente' : 'Assistente'}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          src={`/canvas/index.html?embed=1&theme=${initialTheme}`}
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
