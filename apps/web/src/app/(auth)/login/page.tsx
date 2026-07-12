'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client';
import { Button, Card, Field, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState('');
  const [next, setNext] = useState('/app');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('verified') === '1') setBanner('E-mail confirmado! Faça login para continuar.');
    if (q.get('verified') === '0') setErr('Link de confirmação inválido ou expirado.');
    if (q.get('next')) setNext(q.get('next')!);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setCode('');
    setLoading(true);
    try {
      await api('/auth/login', { method: 'POST', body: { email, password } });
      router.push(next);
      router.refresh();
    } catch (e: any) {
      setErr(e.message || 'Falha ao entrar');
      if (e instanceof ApiError) setCode(e.code);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await api('/auth/resend', { method: 'POST', body: { email } });
      setBanner('Reenviamos o link de confirmação, verifique seu e-mail.');
      setErr('');
    } catch {}
  }

  return (
    <Card className="p-7">
      <h1 className="font-display text-2xl font-bold tracking-tight">Entrar</h1>
      <p className="mt-1 text-sm text-dim">Acesse seus diagramas.</p>
      {banner && (
        <div className="mt-4 rounded-lg border border-sless/40 bg-sless/10 px-3 py-2 text-sm text-sless">
          {banner}
        </div>
      )}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <Field label="E-mail">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Senha">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {err && (
          <div className="text-sm text-red">
            {err}
            {code === 'EMAIL_NOT_VERIFIED' && (
              <button type="button" onClick={resend} className="ml-2 underline hover:text-ink">
                reenviar confirmação
              </button>
            )}
          </div>
        )}
        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-dim">
        <Link href="/forgot" className="hover:text-ink">
          Esqueci a senha
        </Link>
        <Link href="/register" className="hover:text-ink">
          Criar conta
        </Link>
      </div>
    </Card>
  );
}
