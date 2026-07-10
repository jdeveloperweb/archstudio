'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { Button, Card, Field, Input } from '@/components/ui';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/auth/forgot', { method: 'POST', body: { email } });
    } catch {}
    setDone(true);
    setLoading(false);
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">Esqueci a senha</h1>
      {done ? (
        <p className="mt-3 text-sm text-dim">
          Se o e-mail existir, enviamos um link para redefinir sua senha.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Enviar link
          </Button>
        </form>
      )}
      <div className="mt-4 text-center text-sm text-dim">
        <Link href="/login" className="hover:text-ink">
          Voltar ao login
        </Link>
      </div>
    </Card>
  );
}
