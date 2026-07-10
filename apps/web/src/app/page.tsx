import Link from 'next/link';
import { Logo } from '@/components/Brand';

export default function Landing() {
  return (
    <div className="grid-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center px-6 py-5">
        <Logo className="text-lg" />
        <div className="flex-1" />
        <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-dim hover:text-ink">
          Entrar
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Criar conta
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-16 text-center sm:pt-24">
        <div className="mb-4 inline-block rounded-full border border-border bg-panel2 px-3 py-1 font-mono text-xs tracking-widest text-dim">
          ARQUITETURA · IA · NO NAVEGADOR
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Desenhe arquitetura de software
          <br />
          <span className="text-accent">com um assistente de IA</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-dim">
          Converse sobre a solução, discuta trade-offs e veja o diagrama sendo desenhado na hora.
          Use sua própria chave de API (OpenAI, Claude, Gemini e mais). Projetos privados, export
          PNG/SVG, e o gerador de infraestrutura como código.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:brightness-110"
          >
            Começar grátis
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-border bg-panel2 px-6 py-3 font-semibold text-ink hover:border-accent"
          >
            Já tenho conta
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-3xl gap-4 sm:grid-cols-2">
          {[
            ['🤖 Chat de IA que desenha', 'Peça “desenhe um checkout resiliente na AWS” e o diagrama aparece — pronto para ajustar.'],
            ['🧩 100+ componentes', 'AWS, GCP, Azure, on-premise e uma seção inteira de IA: RAG, agentes, MCP, vetores.'],
            ['🔒 Projetos privados', 'Cada conta tem seus diagramas, salvos com segurança. Sua chave de API fica cifrada.'],
            ['☁️ Diagrama → Infra', 'Gere AWS CDK ou Terraform a partir do desenho validado, com IAM derivado das setas.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-border bg-panel/60 p-5 text-left">
              <div className="font-semibold">{t}</div>
              <div className="mt-1 text-sm text-dim">{d}</div>
            </div>
          ))}
        </div>

        <footer className="py-16 text-sm text-dim">
          <Logo /> — feito para humanos e agentes de IA.
        </footer>
      </main>
    </div>
  );
}
