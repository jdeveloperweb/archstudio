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
        className={`rounded-lg px-3 py-1.5 text-sm transition ${
          active ? 'bg-panel2 text-accent' : 'text-dim hover:text-ink'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-panel/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/app" className="mr-2">
          <Logo className="text-base" />
        </Link>
        {link('/app', 'Projetos')}
        {link('/app/settings', 'Configurações')}
        <div className="flex-1" />
        {userName && <span className="hidden text-sm text-dim sm:block">{userName}</span>}
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm text-dim hover:text-red">
          Sair
        </button>
      </div>
    </header>
  );
}
