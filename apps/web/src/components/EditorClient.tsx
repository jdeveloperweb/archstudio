'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Link2, Users } from 'lucide-react';
import { api } from '@/lib/client';
import { ChatPanel } from '@/components/ChatPanel';
import { Mark } from '@/components/Brand';
import { connectCollab, makeCursorForwarder, type CollabSession, type Peer } from '@/lib/collab';

type Save = 'idle' | 'saving' | 'saved';

export function EditorClient({ id }: { id: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [name, setName] = useState('Diagrama');
  const [save, setSave] = useState<Save>('idle');
  // a Ari comeca fechada — o canvas inteiro para desenhar; a escolha fica lembrada
  const [chatOpen, setChatOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);

  // colaboração em tempo real
  const [myName, setMyName] = useState('');
  const [myId, setMyId] = useState('');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const collabRef = useRef<CollabSession | null>(null);
  const fwdRef = useRef<ReturnType<typeof makeCursorForwarder> | null>(null);

  const docRef = useRef<any>(null); // last known doc
  const readyRef = useRef(false); // iframe embed bridge ready
  const saveTimer = useRef<any>(null);
  const getResolvers = useRef<((doc: any) => void)[]>([]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = shareToken ? `${origin}/s/${shareToken}` : '';
  const others = peers.filter((p) => p.id !== myId);

  const CHAT_KEY = 'as_chat_aberto';
  useEffect(() => {
    try {
      if (localStorage.getItem(CHAT_KEY) === '1') setChatOpen(true);
    } catch {}
  }, []);
  const toggleChat = useCallback(() => {
    setChatOpen((v) => {
      try {
        localStorage.setItem(CHAT_KEY, v ? '0' : '1');
      } catch {}
      return !v;
    });
  }, []);

  // meu nome (para a presença) — vem do perfil
  useEffect(() => {
    (async () => {
      try {
        const me = await api<any>('/me');
        setMyName(me?.name || me?.email?.split('@')[0] || 'Você');
      } catch {
        setMyName('Você');
      }
    })();
  }, []);

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
        if (p.shareToken) setShareToken(p.shareToken); // já era um desenho compartilhado
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

  // sessão de colaboração: ativa quando o desenho tem link e o canvas está pronto
  useEffect(() => {
    if (!ready || !shareToken || !myName) return;
    const fwd = makeCursorForwarder(post);
    fwdRef.current = fwd;
    const session = connectCollab(shareToken, myName, {
      onInit: (doc, ps, me) => {
        if (me) setMyId(me.id);
        setPeers(ps);
        fwd.onPeers(ps);
        if (doc && (doc.state || doc.format)) post({ type: 'archstudio:load', doc });
      },
      onDoc: (doc) => post({ type: 'archstudio:apply-remote', doc }),
      onPeers: (ps) => {
        setPeers(ps);
        fwd.onPeers(ps);
      },
      onCursor: (c) => fwd.onCursor(c),
    });
    collabRef.current = session;
    return () => {
      session.close();
      fwd.stop();
      collabRef.current = null;
      fwdRef.current = null;
      setPeers([]);
    };
  }, [ready, shareToken, myName, post]);

  // bridge messages from the canvas iframe
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (ev.origin !== origin) return;
      const m = ev.data || {};
      if (m.type === 'archstudio:ready') {
        readyRef.current = true;
        setReady(true);
        sendLoad();
      } else if (m.type === 'archstudio:change' && m.doc) {
        docRef.current = m.doc;
        if (collabRef.current) collabRef.current.sendDoc(m.doc); // colab: servidor persiste
        else scheduleSave(m.doc);
      } else if (m.type === 'archstudio:cursor') {
        collabRef.current?.sendCursor(m.x, m.y);
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

  async function enableShare() {
    try {
      const r = await api<{ token: string }>('/projects/' + id + '/share', { method: 'POST' });
      setShareToken(r.token);
      setShareOpen(true);
    } catch {}
  }

  async function stopShare() {
    try {
      await api('/projects/' + id + '/share', { method: 'DELETE' });
    } catch {}
    setShareToken(null);
    setShareOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
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
            shareToken ? 'text-accent' : save === 'saving' ? 'text-aws' : save === 'saved' ? 'text-sless' : 'text-transparent'
          }`}
          aria-live="polite"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${shareToken ? 'bg-accent' : save === 'saving' ? 'animate-caret bg-aws' : 'bg-sless'}`} />
          {shareToken ? 'colaboração ativa' : save === 'saving' ? 'salvando…' : 'salvo'}
        </span>
        <div className="flex-1" />

        {/* presença: quem mais está no desenho */}
        {others.length > 0 && (
          <div className="flex items-center gap-1.5" title={others.map((p) => p.name).join(', ')}>
            <div className="flex -space-x-2">
              {others.slice(0, 4).map((p) => (
                <span
                  key={p.id}
                  className="grid h-6 w-6 place-items-center rounded-full border-2 border-panel text-[10px] font-bold text-white"
                  style={{ background: p.color }}
                  title={p.name}
                >
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
            {others.length > 4 && <span className="font-mono text-xs text-dim">+{others.length - 4}</span>}
          </div>
        )}

        {/* compartilhar */}
        <div className="relative">
          <button
            onClick={() => (shareToken ? setShareOpen((v) => !v) : enableShare())}
            className={`btn-focus flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
              shareToken ? 'border-accent/50 bg-accent/15 text-ink' : 'border-border bg-panel2 text-ink hover:border-accent/60'
            }`}
          >
            {shareToken ? <Users size={14} /> : <Link2 size={14} />}
            {shareToken ? 'Compartilhado' : 'Compartilhar'}
          </button>
          {shareOpen && shareToken && (
            <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-border bg-panel p-3 shadow-xl">
              <p className="mb-1 text-sm font-semibold">Colaborar neste desenho</p>
              <p className="mb-2 text-xs text-dim">
                Qualquer pessoa com o link edita junto, em tempo real. O nome de quem entra aparece no desenho.
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-panel2 px-2 py-1.5 font-mono text-xs"
                />
                <button
                  onClick={copyLink}
                  className="btn-focus grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-panel2 transition hover:border-accent/60"
                  title="Copiar link"
                >
                  {copied ? <Check size={14} className="text-sless" /> : <Copy size={14} />}
                </button>
              </div>
              <button
                onClick={stopShare}
                className="btn-focus mt-2 text-xs text-dim transition hover:text-red"
              >
                Parar de compartilhar
              </button>
            </div>
          )}
        </div>

        <button
          onClick={toggleChat}
          className={`btn-focus flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition ${
            chatOpen
              ? 'border-accent/50 bg-accent/15 text-ink'
              : 'border-border bg-panel2 text-ink hover:border-accent/60'
          }`}
        >
          <Mark size={14} />
          {chatOpen ? 'Ocultar Ari' : 'Ari'}
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
