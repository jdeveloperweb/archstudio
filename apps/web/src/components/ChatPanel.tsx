'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowUp, PenTool, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { api, ApiError } from '@/lib/client';
import type { ChatMsg } from '@/lib/types';
import { Mark } from '@/components/Brand';
import { Markdown } from '@/components/Markdown';

type SpecState = 'pending' | 'applied' | 'dismissed';
type UiMsg = ChatMsg & { spec?: any; specState?: SpecState };

const AI_NAME = 'Ari';

const QUICK_ACTIONS = [
  {
    label: 'Analisar meu desenho',
    prompt:
      'Analise o desenho que já está no canvas: o que está bom, qual o maior risco hoje e de 1 a 3 melhorias concretas citando os componentes pelo nome. Não redesenhe — só me diga sua leitura.',
    icon: Search,
  },
  {
    label: 'Melhorar desenho',
    prompt: 'Analise o desenho atual e melhore a arquitetura mantendo a intenção original. Adicione só o que trouxer valor real.',
    icon: Sparkles,
  },
  {
    label: 'Segurança',
    prompt: 'Fortaleça a segurança desta arquitetura com autenticação, autorização, segredos e fronteiras de rede onde fizer sentido.',
    icon: ShieldCheck,
  },
  {
    label: 'Observabilidade',
    prompt: 'Adicione observabilidade ao desenho atual: logs, métricas, traces, alertas e componentes necessários para operar em produção.',
    icon: Activity,
  },
  {
    label: 'IA/RAG',
    prompt: 'Evolua esta arquitetura com uma camada de IA/RAG bem desenhada, incluindo ingestão, embeddings, vector DB, retriever, LLM e guardrails.',
    icon: PenTool,
  },
];

function AriAvatar({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-xl border border-accent/35 bg-gradient-to-br from-accent/20 via-panel to-pulse/15 shadow-[0_8px_26px_-18px_rgb(var(--c-accent)/0.8)] ${
        small ? 'h-7 w-7' : 'h-9 w-9'
      }`}
      aria-hidden
    >
      <Mark size={small ? 14 : 18} />
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-sless" />
    </span>
  );
}

/** Quantos componentes do spec já existem no desenho atual (mesma heurística do canvas). */
function countMatches(spec: any, diagram: any): { total: number; matches: number } {
  const sN: any[] = spec?.nodes || [];
  const cur: any[] = diagram?.state?.nodes || [];
  const matches = sN.filter((sn) =>
    cur.some(
      (dn) =>
        (sn.id != null && (String(dn.aid) === String(sn.id) || String(dn.id) === String(sn.id))) ||
        (!!(sn.label || '').trim() &&
          (dn.label || '').trim().toLowerCase() === (sn.label || '').trim().toLowerCase()),
    ),
  ).length;
  return { total: sN.length, matches };
}

/**
 * Desenho grande ou substituição total pedem confirmação;
 * ajustes pequenos aplicam direto, sem atrapalhar o fluxo.
 */
function needsConfirm(spec: any, diagram: any): boolean {
  const { total, matches } = countMatches(spec, diagram);
  if (!total) return false;
  const curCount = (diagram?.state?.nodes || []).length;
  if (curCount > 0 && matches === 0) return true; // troca o desenho inteiro
  return total - matches >= 8; // muitos componentes novos de uma vez
}

function specSummary(spec: any): string {
  const n = (spec?.nodes || []).length;
  const e = (spec?.edges || []).length;
  const b = (spec?.boxes || []).length;
  const parts = [`${n} ${n === 1 ? 'componente' : 'componentes'}`, `${e} ${e === 1 ? 'conexão' : 'conexões'}`];
  if (b) parts.push(`${b} ${b === 1 ? 'caixa' : 'caixas'}`);
  return parts.join(' · ');
}

export function ChatPanel({
  getDoc,
  onApplySpec,
}: {
  getDoc: () => Promise<any>;
  onApplySpec: (spec: any) => void;
}) {
  const [messages, setMessages] = useState<UiMsg[]>([
    {
      role: 'assistant',
      content:
        'Oi, eu sou a Ari. Me diga o objetivo do sistema, a nuvem preferida ou o problema que quer resolver. Eu posso propor a arquitetura, desenhar no canvas e evoluir o que já existe.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [needKey, setNeedKey] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function scrollDown() {
    setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 30);
  }

  function setSpecState(idx: number, state: SpecState) {
    setMessages((xs) => xs.map((m, i) => (i === idx ? { ...m, specState: state } : m)));
  }

  function applySpecAt(idx: number, spec: any) {
    onApplySpec(spec);
    setSpecState(idx, 'applied');
  }

  function useSuggestion(prompt: string) {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 20);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setNeedKey(false);
    const history = [...messages, { role: 'user' as const, content: text }];
    setMessages(history);
    scrollDown();
    setLoading(true);
    try {
      const diagram = await getDoc();
      const payload = history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api<{ reply: string; spec: any }>('/ai/chat', {
        method: 'POST',
        body: { messages: payload, diagram },
      });
      if (res.spec && needsConfirm(res.spec, diagram)) {
        // arquitetura grande: mostra o resumo e espera o OK antes de desenhar
        setMessages((xs) => [
          ...xs,
          { role: 'assistant', content: res.reply || '…', spec: res.spec, specState: 'pending' },
        ]);
      } else {
        if (res.spec) onApplySpec(res.spec);
        setMessages((xs) => [
          ...xs,
          { role: 'assistant', content: res.reply || '…', spec: res.spec, specState: res.spec ? 'applied' : undefined },
        ]);
      }
      scrollDown();
    } catch (e: any) {
      if (e instanceof ApiError && e.code === 'NO_API_KEY') {
        setNeedKey(true);
      }
      setMessages((xs) => [
        ...xs,
        { role: 'assistant', content: 'Algo deu errado: ' + (e.message || 'falha ao falar com a IA.') },
      ]);
      scrollDown();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <AriAvatar />
        <div>
          <div className="text-sm font-semibold leading-tight">{AI_NAME}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">arquiteta IA do ArchStudio</div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start gap-2'}>
            {m.role === 'assistant' && <AriAvatar small />}
            <div
              className={`${m.role === 'user' ? 'max-w-[85%]' : 'max-w-[78%]'} rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'whitespace-pre-wrap rounded-br-md bg-gradient-to-b from-accent to-[#8b5cf6] text-white'
                  : 'rounded-bl-md border border-border bg-panel2 text-ink'
              }`}
            >
              {m.role === 'user' ? m.content : <Markdown text={m.content} />}

              {m.specState === 'pending' && (
                <div className="mt-2.5 rounded-xl border border-accent/40 bg-accent/10 p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-accent">
                    <PenTool size={12} /> desenho grande à vista
                  </div>
                  <div className="mt-1 text-xs text-dim">
                    {specSummary(m.spec)}. Quer que eu desenhe no canvas agora?
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => applySpecAt(i, m.spec)}
                      className="btn-focus inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-accent to-[#8b5cf6] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                    >
                      <PenTool size={12} /> Desenhar agora
                    </button>
                    <button
                      onClick={() => setSpecState(i, 'dismissed')}
                      className="btn-focus inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-dim transition hover:text-ink"
                    >
                      <X size={12} /> Agora não
                    </button>
                  </div>
                </div>
              )}

              {m.specState === 'applied' && (
                <div className="mt-1.5 font-mono text-xs text-sless">✓ aplicado ao desenho</div>
              )}

              {m.specState === 'dismissed' && (
                <div className="mt-1.5 font-mono text-xs text-dim">
                  desenho não aplicado ·{' '}
                  <button onClick={() => applySpecAt(i, m.spec)} className="underline transition hover:text-ink">
                    desenhar mesmo assim
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start gap-2">
            <AriAvatar small />
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-panel2 px-3.5 py-2 text-sm text-dim">
              <span className="h-1.5 w-1.5 animate-caret rounded-full bg-pulse" />
              Ari pensando no desenho…
            </div>
          </div>
        )}
        {needKey && (
          <div className="rounded-xl border border-aws/40 bg-aws/10 px-3 py-2 text-xs text-aws">
            Você ainda não configurou uma chave de API.{' '}
            <Link href="/app/settings" className="underline">
              Configurar agora
            </Link>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map(({ label, prompt, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => useSuggestion(prompt)}
              className="btn-focus inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-panel2/70 px-2.5 py-1.5 text-left text-[11.5px] font-medium text-dim transition hover:border-accent/50 hover:text-ink"
            >
              <Icon size={13} className="shrink-0 text-accent" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Peça para a Ari desenhar, revisar ou evoluir…"
            aria-label="Mensagem para o assistente"
            className="btn-focus w-full resize-none rounded-xl border border-border bg-void/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-dim/70 transition focus:border-accent/70 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Enviar mensagem"
            className="btn-focus flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-accent to-[#8b5cf6] text-white shadow-[0_4px_18px_-6px_rgba(166,121,255,0.6)] transition hover:brightness-110 disabled:opacity-40"
          >
            <ArrowUp size={17} />
          </button>
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-dim/70">Enter envia · Shift+Enter quebra linha</p>
      </div>
    </div>
  );
}
