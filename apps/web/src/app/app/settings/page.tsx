import { apiServer } from '@/lib/server';
import { SettingsForm } from '@/components/SettingsForm';
import type { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const r = await apiServer('/settings');
  const settings: Settings = r.ok
    ? r.data
    : { provider: 'openai', model: 'gpt-4o-mini', baseUrl: '', hasKey: false };
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="eyebrow">assistente</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Configurações</h1>
      <p className="mt-2 text-sm leading-relaxed text-dim">
        Escolha o provedor de IA e informe sua chave de API. Ela é guardada cifrada e usada apenas
        para o assistente desenhar em seu nome.
      </p>
      <div className="mt-7">
        <SettingsForm initial={settings} />
      </div>
    </main>
  );
}
