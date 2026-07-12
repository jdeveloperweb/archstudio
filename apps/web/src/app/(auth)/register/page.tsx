'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { api } from '@/lib/client';
import { Button, Card, Field, Input } from '@/components/ui';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api('/auth/register', { method: 'POST', body: { name, email, password } });
      setDone(true);
    } catch (e: any) {
      setErr(e.message || 'Falha ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Card className="p-7 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <MailCheck size={22} />
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm text-dim">
          Enviamos um link de confirmação para <span className="text-ink">{email}</span>. Clique nele
          para ativar sua conta e depois faça login.
        </p>
        <Link href="/login" className="mt-5 inline-block text-sm text-accent hover:underline">
          Ir para o login
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="font-display text-2xl font-bold tracking-tight">Criar conta</h1>
      <p className="mt-1 text-sm text-dim">Grátis. Sem cartão.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Senha" hint="Mínimo de 8 caracteres.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </Field>
        {err && <div className="text-sm text-red">{err}</div>}
        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>
      <div className="mt-4 text-center text-sm text-dim">
        Já tem conta?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </div>
    </Card>
  );
}
