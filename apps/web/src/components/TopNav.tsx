'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Logo } from './Brand';
import { api } from '@/lib/client';

export function TopNav({ userName, avatar }: { userName?: string; avatar?: string | null }) {
  const router = useRouter();
  const path = usePathname();

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
  }

  const link = (href: string, label: string) => {
    const active = path === href || (href !== '/app' && path.startsWith(href));
    return (
      <Link
        href={href}
        className={`btn-focus rounded-lg px-3 py-1.5 text-sm transition ${
          active ? 'bg-accent/15 font-medium text-accent' : 'text-dim hover:text-ink'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/75 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/app" className="btn-focus mr-3 rounded-lg">
          <Logo className="text-base" />
        </Link>
        {link('/app', 'Projetos')}
        {link('/app/settings', 'Configurações')}
        <div className="flex-1" />
        {userName && (
          <Link
            href="/app/settings"
            className="btn-focus hidden items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-panel2 sm:flex"
            title="Seu perfil"
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-7 w-7 rounded-full border border-border object-cover" />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-accent to-[#8b5cf6] font-mono text-xs font-bold text-white">
                {userName.trim().charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-sm text-dim">{userName}</span>
          </Link>
        )}
        <button
          onClick={logout}
          className="btn-focus flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-dim transition hover:text-red"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </header>
  );
}
