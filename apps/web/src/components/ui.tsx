'use client';
import React from 'react';

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
};

export function Button({ variant = 'primary', loading, className = '', children, ...rest }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 btn-focus disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = {
    primary:
      'bg-gradient-to-b from-accent to-[#8b5cf6] text-white shadow-[0_4px_20px_-6px_rgba(166,121,255,0.55)] hover:shadow-[0_6px_26px_-6px_rgba(166,121,255,0.8)] hover:brightness-110 active:translate-y-px',
    ghost: 'border border-border bg-panel2/80 text-ink hover:border-accent/70 hover:bg-panel2',
    danger: 'border border-border bg-transparent text-red hover:border-red/70 hover:bg-red/10',
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-void/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-dim/70 transition focus:border-accent/70 focus:bg-void/80 btn-focus ${props.className || ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-border bg-void/60 px-3.5 py-2.5 text-sm text-ink transition focus:border-accent/70 btn-focus ${props.className || ''}`}
    />
  );
}

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-dim/90">{hint}</span>}
      {error && <span className="block text-xs text-red">{error}</span>}
    </label>
  );
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`surface before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-2xl before:bg-gradient-to-r before:from-transparent before:via-accent/50 before:to-transparent ${className}`}
    >
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}
