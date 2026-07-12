import { redirect } from 'next/navigation';
import { apiServer, getMe } from '@/lib/server';
import { SettingsForm } from '@/components/SettingsForm';
import { DangerSection, PasswordSection, ProfileSection } from '@/components/AccountForms';
import type { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await getMe();
  if (!me) redirect('/login');
  const r = await apiServer('/settings');
  const settings: Settings = r.ok
    ? r.data
    : { provider: 'openai', model: 'gpt-4o-mini', baseUrl: '', hasKey: false };
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <p className="eyebrow">sua conta</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Configurações</h1>
      </div>

      <ProfileSection me={me} />

      <section>
        <h2 className="mb-3 mt-2 font-semibold">Assistente de IA</h2>
        <p className="mb-4 text-sm leading-relaxed text-dim">
          Escolha o provedor e informe sua chave de API. Ela é guardada cifrada (AES-256-GCM) e
          usada apenas para o assistente desenhar em seu nome.
        </p>
        <SettingsForm initial={settings} />
      </section>

      <PasswordSection />
      <DangerSection />
    </main>
  );
}
