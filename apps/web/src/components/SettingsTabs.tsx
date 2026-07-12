'use client';
import { useEffect, useState } from 'react';
import { Bot, ShieldCheck, UserRound, UserX } from 'lucide-react';
import { SettingsForm } from '@/components/SettingsForm';
import { DangerSection, PasswordSection, ProfileSection } from '@/components/AccountForms';
import type { Settings, User } from '@/lib/types';

const TABS = [
  { id: 'perfil', label: 'Perfil', icon: UserRound },
  { id: 'ia', label: 'Assistente de IA', icon: Bot },
  { id: 'senha', label: 'Senha', icon: ShieldCheck },
  { id: 'conta', label: 'Conta', icon: UserX },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsTabs({ me, settings }: { me: User; settings: Settings }) {
  const [tab, setTab] = useState<TabId>('perfil');

  // deep link: /app/settings#ia abre direto a aba
  useEffect(() => {
    const h = window.location.hash.replace('#', '') as TabId;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);

  function open(id: TabId) {
    setTab(id);
    history.replaceState(null, '', '#' + id);
  }

  return (
    <div>
      <div role="tablist" aria-label="Seções de configuração" className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => open(id)}
              className={`btn-focus relative -mb-px inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm transition ${
                active
                  ? 'border-b-2 border-accent font-medium text-ink'
                  : 'border-b-2 border-transparent text-dim hover:text-ink'
              }`}
            >
              <Icon size={15} className={active ? 'text-accent' : ''} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="pt-6">
        {tab === 'perfil' && <ProfileSection me={me} />}
        {tab === 'ia' && (
          <div>
            <p className="mb-4 text-sm leading-relaxed text-dim">
              Escolha o provedor e informe sua chave de API. Ela é guardada cifrada (AES-256-GCM) e
              usada apenas para o assistente desenhar em seu nome.
            </p>
            <SettingsForm initial={settings} />
          </div>
        )}
        {tab === 'senha' && <PasswordSection />}
        {tab === 'conta' && <DangerSection />}
      </div>
    </div>
  );
}
