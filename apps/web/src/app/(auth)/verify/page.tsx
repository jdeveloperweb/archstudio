'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';

export default function VerifyInfoPage() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has('verified')) setOk(q.get('verified') === '1');
  }, []);
  return (
    <Card className="p-6 text-center">
      <div className="text-3xl">{ok === false ? '⚠️' : '✅'}</div>
      <h1 className="mt-2 text-xl font-semibold">
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
