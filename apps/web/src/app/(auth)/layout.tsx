import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/Brand';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12 text-ink">
      {/* prancheta em perspectiva */}
      <div className="floor-3d" aria-hidden />

      {/* brilho de tinta no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-8rem] h-72 w-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle at center, rgba(166,121,255,0.35), transparent 65%)' }}
      />

      {/* nós flutuando fora de foco, como um desenho ao fundo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="animate-floaty absolute left-[12%] top-[18%] h-10 w-24 rounded-lg border border-accent/30 bg-accent/10 blur-[1.5px]" />
        <span className="animate-floaty absolute right-[14%] top-[30%] h-9 w-20 rounded-lg border border-pulse/30 bg-pulse/10 blur-[2px]" style={{ animationDelay: '-2.5s' }} />
        <span className="animate-floaty absolute bottom-[24%] left-[20%] h-9 w-16 rounded-lg border border-aws/30 bg-aws/10 blur-[2px]" style={{ animationDelay: '-4.5s' }} />
      </div>

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-7 flex justify-center">
          <Link href="/" aria-label="ArchStudio — início" className="btn-focus rounded-lg">
            <Logo className="text-2xl" />
          </Link>
        </div>
        {children}
        <p className="mt-8 text-center font-mono text-xs text-dim/80">
          © {new Date().getFullYear()} ArchStudio · a arquitetura se desenha enquanto você conversa
        </p>
      </div>
    </main>
  );
}
