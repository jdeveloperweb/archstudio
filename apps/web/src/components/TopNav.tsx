'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './Brand';
import { api } from '@/lib/client';

export function TopNav({ userName }: { userName?: string }) {
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
          <span className="hidden items-center gap-2 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-accent to-[#8b5cf6] font-mono text-xs font-bold text-white">
              {userName.trim().charAt(0).toUpperCase()}
            </span>
            <span className="text-sm text-dim">{userName}</span>
          </span>
        )}
        <button
          onClick={logout}
          className="btn-focus rounded-lg px-3 py-1.5 text-sm text-dim transition hover:text-red"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
