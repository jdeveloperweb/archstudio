'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { Button, Card, Field, Input } from '@/components/ui';
import { PROVIDERS, type Provider, type Settings } from '@/lib/types';

export function SettingsForm({ initial }: { initial: Settings }) {
  const [provider, setProvider] = useState<Provider>(initial.provider || 'openai');
  const [model, setModel] = useState(initial.model || '');
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl || '');
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(initial.hasKey);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const def = PROVIDERS.find((p) => p.id === provider)!;
  const isCustom = provider === 'custom';

  function onProvider(p: Provider) {
    setProvider(p);
    const d = PROVIDERS.find((x) => x.id === p)!;
    setModel(d.defaultModel);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const body: any = { provider, model, baseUrl: isCustom ? baseUrl : undefined };
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      const res = await api<Settings>('/settings', { method: 'PUT', body });
      setHasKey(res.hasKey);
      setApiKey('');
      setMsg('Configurações salvas.');
    } catch (e: any) {
      setErr(e.message || 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <form onSubmit={save} className="space-y-6">
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Provedor de IA
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PROVIDERS.map((p) => {
              const active = p.id === provider;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onProvider(p.id)}
                  aria-pressed={active}
                  className={`btn-focus rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'border-accent/80 bg-accent/15 font-medium text-ink shadow-[0_0_18px_-6px_rgba(166,121,255,0.6)]'
                      : 'border-border bg-void/40 text-dim hover:border-accent/40 hover:text-ink'
                  }`}
                >
                  {p.label.replace(' (OpenAI-compat)', '')}
                  {p.id === 'custom' && (
                    <span className="block font-mono text-[10px] opacity-70">OpenAI-compat</span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field
          label="Modelo"
          hint={def.defaultModel ? `Padrão: ${def.defaultModel}` : 'Informe o modelo do seu endpoint.'}
        >
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={def.defaultModel} />
        </Field>

        {isCustom && (
          <Field
            label="Base URL (OpenAI-compat)"
            hint="Ex.: http://seu-servidor:11434/v1 (Ollama), ou outro endpoint compatível."
          >
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://.../v1" />
          </Field>
        )}

        <Field
          label="Chave de API"
          hint={
            hasKey
              ? 'Uma chave já está salva (cifrada). Deixe em branco para mantê-la.'
              : 'Sua chave é armazenada cifrada (AES-256-GCM).'
          }
        >
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? '•••••••••• (mantém a atual)' : 'cole sua chave aqui'}
            autoComplete="off"
          />
        </Field>

        {msg && <div className="text-sm text-sless">{msg}</div>}
        {err && <div className="text-sm text-red">{err}</div>}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={loading}>
            Salvar
          </Button>
          <span className="font-mono text-xs text-dim">
            {hasKey ? '🔒 chave configurada' : '⚠️ sem chave — o assistente não funcionará'}
          </span>
        </div>
      </form>
    </Card>
  );
}
