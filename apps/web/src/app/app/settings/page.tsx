import { redirect } from 'next/navigation';
import { apiServer, getMe } from '@/lib/server';
import { SettingsTabs } from '@/components/SettingsTabs';
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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="eyebrow">sua conta</p>
      <h1 className="mb-7 mt-2 font-display text-3xl font-bold tracking-tight">Configurações</h1>
      <SettingsTabs me={me} settings={settings} />
    </main>
  );
}
