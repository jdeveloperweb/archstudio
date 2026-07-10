'use client';
import React from 'react';

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
};

export function Button({ variant = 'primary', loading, className = '', children, ...rest }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition btn-focus disabled:opacity-50 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-accent text-white hover:brightness-110',
    ghost: 'border border-border bg-panel2 text-ink hover:border-accent',
    danger: 'border border-border text-red hover:border-red',
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
      className={`w-full rounded-lg border border-border bg-panel2 px-3 py-2 text-sm text-ink placeholder:text-dim btn-focus ${props.className || ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-border bg-panel2 px-3 py-2 text-sm text-ink btn-focus ${props.className || ''}`}
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
      <span className="text-xs font-medium text-dim">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-dim">{hint}</span>}
      {error && <span className="block text-xs text-red">{error}</span>}
    </label>
  );
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-border bg-panel/80 backdrop-blur ${className}`}>{children}</div>
  );
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}
