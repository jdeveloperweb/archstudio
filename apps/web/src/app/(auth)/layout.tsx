import Link from 'next/link';
import type { ReactNode } from 'react';

// Brand mark rendered inline so the auth pages never depend on a shared
// component whose module path/export isn't fixed by CONTRACT.md.
function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex items-baseline gap-0.5 text-2xl font-semibold tracking-tight text-ink"
      aria-label="ArchStudio — início"
    >
      <span className="text-accent">Arch</span>
      <span>Studio</span>
    </Link>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12 text-ink">
      {/* Subtle grid background with a radial fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(42,47,71,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,47,71,0.45) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 60% at 50% 35%, black 20%, transparent 75%)',
          maskImage:
            'radial-gradient(ellipse 75% 60% at 50% 35%, black 20%, transparent 75%)',
        }}
      />
      {/* Accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-8rem] h-72 w-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at center, rgba(166,121,255,0.35), transparent 65%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <Brand />
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-dim">
          © {new Date().getFullYear()} ArchStudio · Desenhe arquitetura de software com IA
        </p>
      </div>
    </main>
  );
}
