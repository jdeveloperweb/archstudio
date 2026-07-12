'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { Button, Card, Field, Input } from '@/components/ui';

export default function ResetPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setToken(q.get('token') || '');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api('/auth/reset', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (e: any) {
      setErr(e.message || 'Falha ao redefinir');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <h1 className="font-display text-2xl font-bold tracking-tight">Redefinir senha</h1>
      {done ? (
        <p className="mt-3 text-sm text-dim">
          Senha redefinida.{' '}
          <Link href="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
          </Field>
          {!token && <div className="text-sm text-red">Token ausente. Use o link do e-mail.</div>}
          {err && <div className="text-sm text-red">{err}</div>}
          <Button type="submit" loading={loading} disabled={!token} className="w-full">
            Redefinir
          </Button>
        </form>
      )}
    </Card>
  );
}
