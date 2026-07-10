'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { Button, Card, Field, Input, Select } from '@/components/ui';
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
    <Card className="p-6">
      <form onSubmit={save} className="space-y-5">
        <Field label="Provedor de IA">
          <Select value={provider} onChange={(e) => onProvider(e.target.value as Provider)}>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Modelo" hint={def.defaultModel ? `Padrão: ${def.defaultModel}` : 'Informe o modelo do seu endpoint.'}>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={def.defaultModel} />
        </Field>

        {isCustom && (
          <Field label="Base URL (OpenAI-compat)" hint="Ex.: http://seu-servidor:11434/v1 (Ollama), ou outro endpoint compatível.">
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://.../v1" />
          </Field>
        )}

        <Field
          label="Chave de API"
          hint={hasKey ? 'Uma chave já está salva (cifrada). Deixe em branco para mantê-la.' : 'Sua chave é armazenada cifrada (AES-256-GCM).'}
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
          <span className="text-xs text-dim">
            {hasKey ? '🔒 chave configurada' : '⚠️ sem chave — o assistente não funcionará'}
          </span>
        </div>
      </form>
    </Card>
  );
}
