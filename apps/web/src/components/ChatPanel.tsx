'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import { api, ApiError } from '@/lib/client';
import type { ChatMsg } from '@/lib/types';
import { Mark } from '@/components/Brand';

type UiMsg = ChatMsg & { applied?: boolean };

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
        'Oi! Descreva a arquitetura que você quer e eu desenho. Ex.: “API de pedidos com fila, worker de pagamento e Postgres na AWS”. Também posso ajustar o desenho atual.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [needKey, setNeedKey] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 30);
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
      const applied = !!res.spec;
      if (applied) onApplySpec(res.spec);
      setMessages((xs) => [...xs, { role: 'assistant', content: res.reply || '…', applied }]);
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
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/10">
          <Mark size={15} />
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight">Assistente de arquitetura</div>
          <div className="font-mono text-[10px] text-dim">desenha enquanto responde</div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md bg-gradient-to-b from-accent to-[#8b5cf6] text-white'
                  : 'rounded-bl-md border border-border bg-panel2 text-ink'
              }`}
            >
              {m.content}
              {m.applied && (
                <div className="mt-1.5 font-mono text-xs text-sless">✓ aplicado ao desenho</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-panel2 px-3.5 py-2 text-sm text-dim">
              <span className="h-1.5 w-1.5 animate-caret rounded-full bg-pulse" />
              desenhando…
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
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Descreva ou peça uma alteração…"
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
