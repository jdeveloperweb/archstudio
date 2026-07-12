'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui';

export default function VerifyInfoPage() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has('verified')) setOk(q.get('verified') === '1');
  }, []);
  return (
    <Card className="p-7 text-center">
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${ok === false ? 'bg-red/10 text-red' : 'bg-sless/10 text-sless'}`}>
        {ok === false ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
      </span>
      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
        {ok === false ? 'Link inválido' : 'Confirmação de e-mail'}
      </h1>
      <p className="mt-2 text-sm text-dim">
        {ok === false
          ? 'O link é inválido ou expirou. Faça login para reenviar a confirmação.'
          : 'Se seu e-mail foi confirmado, você já pode entrar.'}
      </p>
      <Link href="/login" className="mt-5 inline-block text-sm text-accent hover:underline">
        Ir para o login
      </Link>
    </Card>
  );
}
