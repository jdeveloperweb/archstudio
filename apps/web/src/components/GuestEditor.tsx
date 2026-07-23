'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { api } from '@/lib/client';
import { connectCollab, makeCursorForwarder, type CollabSession, type Peer } from '@/lib/collab';

type Status = 'loading' | 'need-name' | 'ready' | 'invalid';

/**
 * Editor de convidado (link de convite). Abre o desenho compartilhado, pede um
 * nome se a pessoa não estiver logada e entra na sala de colaboração ao vivo.
 * Sem Ari e sem salvar direto — as edições fluem pelo WebSocket e o servidor
 * persiste. Só o dono (na área logada) tem os controles do projeto.
 */
export function GuestEditor({ token }: { token: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [diagName, setDiagName] = useState('Diagrama');
  const [myName, setMyName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [myId, setMyId] = useState('');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [ready, setReady] = useState(false);

  const bootDoc = useRef<any>(null);
  const readyRef = useRef(false);
  const collabRef = useRef<CollabSession | null>(null);
  const fwdRef = useRef<ReturnType<typeof makeCursorForwarder> | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const others = peers.filter((p) => p.id !== myId);
  const canvasTheme = () =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme ? 'dark' : 'light';
  const [initialTheme] = useState(canvasTheme);

  const post = useCallback((msg: any) => {
    iframeRef.current?.contentWindow?.postMessage(msg, origin);
  }, [origin]);

  // bootstrap: carrega o desenho pelo token e tenta o nome do perfil (se logado)
  useEffect(() => {
    (async () => {
      try {
        const boot = await api<any>('/collab/' + token);
        bootDoc.current = boot.doc && boot.doc.format ? boot.doc : { format: 'archstudio', version: 3, state: boot.doc?.state };
        setDiagName(boot.name || 'Diagrama');
        let profileName = '';
        try {
          const me = await api<any>('/me');
          profileName = me?.name || me?.email?.split('@')[0] || '';
        } catch {}
        if (profileName) {
          setMyName(profileName);
          setStatus('ready');
        } else {
          setStatus('need-name');
        }
      } catch {
        setStatus('invalid');
      }
    })();
  }, [token]);

  const sendLoad = useCallback(() => {
    if (!readyRef.current) return;
    post({ type: 'archstudio:theme', theme: canvasTheme() });
    if (bootDoc.current) post({ type: 'archstudio:load', doc: bootDoc.current });
  }, [post]);

  // sessão de colaboração: quando temos nome + doc + canvas pronto
  useEffect(() => {
    if (status !== 'ready' || !ready || !myName) return;
    const fwd = makeCursorForwarder(post);
    fwdRef.current = fwd;
    const session = connectCollab(token, myName, {
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
  }, [status, ready, myName, token, post]);

  // mensagens do canvas
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (ev.origin !== origin) return;
      const m = ev.data || {};
      if (m.type === 'archstudio:ready') {
        readyRef.current = true;
        setReady(true);
        sendLoad();
      } else if (m.type === 'archstudio:change' && m.doc) {
        collabRef.current?.sendDoc(m.doc);
      } else if (m.type === 'archstudio:cursor') {
        collabRef.current?.sendCursor(m.x, m.y);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [origin, sendLoad]);

  if (status === 'invalid') {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-6 text-center">
        <div>
          <p className="mb-2 text-lg font-semibold">Link de colaboração inválido</p>
          <p className="mb-4 text-sm text-dim">Este link não existe mais ou foi revogado pelo dono do desenho.</p>
          <Link href="/" className="text-sm text-accent hover:underline">
            Ir para o ArchStudio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-border/80 bg-panel/80 px-4 py-2 backdrop-blur-md sm:px-6">
        <Link href="/" className="font-mono text-sm font-bold text-accent">
          ArchStudio
        </Link>
        <span className="h-4 w-px bg-border" aria-hidden />
        <span className="truncate text-sm font-semibold">{diagName}</span>
        <span className="hidden items-center gap-1.5 font-mono text-xs text-accent sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          colaboração
        </span>
        <div className="flex-1" />
        {others.length > 0 && (
          <div className="flex items-center gap-1.5" title={others.map((p) => p.name).join(', ')}>
            <Users size={14} className="text-dim" />
            <div className="flex -space-x-2">
              {others.slice(0, 5).map((p) => (
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
            {others.length > 5 && <span className="font-mono text-xs text-dim">+{others.length - 5}</span>}
          </div>
        )}
        {myName && (
          <span className="rounded-lg border border-border bg-panel2 px-2 py-1 text-xs text-dim">
            você: <span className="text-ink">{myName}</span>
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <iframe
          ref={iframeRef}
          src={`/canvas/index.html?embed=1&theme=${initialTheme}`}
          className="h-full w-full border-0 bg-bg"
          onLoad={() => sendLoad()}
          title="ArchStudio canvas"
        />
        {status === 'loading' && (
          <div className="absolute inset-0 grid place-items-center bg-bg/60 text-sm text-dim">carregando…</div>
        )}
        {status === 'need-name' && (
          <div className="absolute inset-0 grid place-items-center bg-bg/80 px-6 backdrop-blur-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = nameInput.trim();
                if (n) {
                  setMyName(n);
                  setStatus('ready');
                }
              }}
              className="w-full max-w-sm rounded-2xl border border-border bg-panel p-5 shadow-xl"
            >
              <p className="mb-1 text-base font-semibold">Entrar no desenho</p>
              <p className="mb-3 text-sm text-dim">
                Você foi convidado para editar <span className="text-ink">{diagName}</span> em tempo real. Como quer aparecer?
              </p>
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={40}
                placeholder="Seu nome"
                className="mb-3 w-full rounded-lg border border-border bg-panel2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="btn-focus w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                Entrar e colaborar
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
