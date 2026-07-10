'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/client';
import type { ChatMsg } from '@/lib/types';

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
        { role: 'assistant', content: '⚠️ ' + (e.message || 'Falha ao falar com a IA.') },
      ]);
      scrollDown();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-lg">🤖</span>
        <div className="text-sm font-semibold">Assistente de arquitetura</div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-accent text-white' : 'border border-border bg-panel2 text-ink'
              }`}
            >
              {m.content}
              {m.applied && (
                <div className="mt-1.5 text-xs text-sless">✎ aplicado ao desenho</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-panel2 px-3 py-2 text-sm text-dim">
              desenhando…
            </div>
          </div>
        )}
        {needKey && (
          <div className="rounded-lg border border-aws/40 bg-aws/10 px-3 py-2 text-xs text-aws">
            Você ainda não configurou uma chave de API.{' '}
            <Link href="/app/settings" className="underline">
              Configurar agora
            </Link>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
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
          placeholder="Descreva ou peça uma alteração…  (Enter envia)"
          className="w-full resize-none rounded-lg border border-border bg-panel2 px-3 py-2 text-sm text-ink placeholder:text-dim focus:border-accent focus:outline-none"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="mt-2 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
