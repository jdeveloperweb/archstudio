import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Boxes,
  BrainCircuit,
  Braces,
  Cloud,
  Database,
  FolderLock,
  ImageDown,
  KeyRound,
  MessagesSquare,
  PenTool,
  Workflow,
} from 'lucide-react';
import { Logo, Mark } from '@/components/Brand';
import { Hero3D } from '@/components/Hero3D';
import { Reveal } from '@/components/Reveal';
import { ParallaxField } from '@/components/Parallax';

/* ---------- catálogo real (espelha o CATALOG do canvas) ---------- */
const CHIPS_AWS = [
  'Lambda', 'S3', 'DynamoDB', 'SQS', 'SNS', 'API Gateway', 'ECS Fargate', 'EKS',
  'RDS', 'Aurora', 'CloudFront', 'Kinesis', 'Step Functions', 'ElastiCache', 'EventBridge',
];
const CHIPS_CLOUD = [
  'Cloud Run', 'BigQuery', 'Pub/Sub', 'GKE', 'Cloud SQL', 'Firestore',
  'AKS', 'Azure Functions', 'Cosmos DB', 'Service Bus', 'Blob Storage', 'Front Door',
];
const CHIPS_IA = [
  'Agente', 'RAG', 'MCP Server', 'Vector DB', 'LLM Gateway', 'Embeddings', 'Guardrails',
  'Kubernetes', 'Kafka', 'Redis', 'Postgres', 'RabbitMQ', 'nginx',
];

function ChipRow({ items, dot, duration, reverse = false }: {
  items: string[];
  dot: string;
  duration: string;
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee">
      <div
        className="marquee-track py-1"
        style={{ ['--marquee-dur' as string]: duration, animationDirection: reverse ? 'reverse' : undefined }}
      >
        {doubled.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-panel px-3.5 py-1.5 font-mono text-xs text-ink/90 shadow-sm"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Conector do pipeline: aresta com pulso, como no canvas. */
function FlowArrow() {
  return (
    <div className="flex items-center justify-center px-1 max-md:rotate-90 max-md:py-1" aria-hidden>
      <svg width="46" height="14" viewBox="0 0 46 14" fill="none">
        <path d="M1 7h38" stroke="#0891b2" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="5 7" className="animate-dash" />
        <path d="m38 2 6 5-6 5" stroke="#0891b2" strokeOpacity="0.7" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Chip flutuante do herói: um componente do catálogo pairando em profundidade. */
function FloatChip({
  icon: Icon,
  label,
  className,
  mouse,
  delay = '0s',
}: {
  icon: typeof Cloud;
  label: string;
  className: string;
  mouse: string;
  delay?: string;
}) {
  return (
    <div className={`absolute ${className}`} data-mouse={mouse} aria-hidden>
      <div
        className="animate-floaty flex items-center gap-2 rounded-2xl border border-border bg-panel/90 px-3.5 py-2 font-mono text-xs text-ink shadow-[0_14px_34px_-14px_rgba(124,58,237,0.4)] backdrop-blur"
        style={{ animationDelay: delay }}
      >
        <Icon size={15} className="text-accent" />
        {label}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="light min-h-screen overflow-x-clip bg-bg text-ink">
      <ParallaxField>
        {/* ---------- aurora: cor viva em camadas de profundidade ---------- */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[130vh] overflow-hidden">
          <div data-depth="0.22" className="animate-blob absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 65%)' }} />
          <div data-depth="0.3" className="animate-blob absolute right-[-8rem] top-[-6rem] h-[30rem] w-[30rem] rounded-full opacity-45 blur-3xl"
            style={{ background: 'radial-gradient(circle, #a5f3fc, transparent 65%)', animationDelay: '-5s' }} />
          <div data-depth="0.14" className="animate-blob absolute left-[30%] top-[46vh] h-[26rem] w-[26rem] rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, #fde68a, transparent 65%)', animationDelay: '-9s' }} />
          <div data-depth="0.26" className="animate-blob absolute right-[22%] top-[70vh] h-[22rem] w-[22rem] rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #fbcfe8, transparent 65%)', animationDelay: '-12s' }} />
        </div>

        {/* ---------- nav ---------- */}
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex max-w-7xl items-center px-5 py-5 sm:px-8">
            <Logo className="text-lg" />
            <div className="flex-1" />
            <Link href="/login" className="btn-focus rounded-xl px-4 py-2 text-sm text-dim transition hover:text-ink">
              Entrar
            </Link>
            <Link
              href="/register"
              className="btn-focus rounded-xl bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(124,58,237,0.6)] transition hover:brightness-110"
            >
              Criar conta
            </Link>
          </div>
        </header>

        {/* ---------- herói: a prancheta viva, agora à luz do dia ---------- */}
        <section className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-6 px-5 pb-10 pt-28 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-2 lg:pt-20">
          <div className="relative z-10 max-w-xl" data-depth="0.06">
            <p className="eyebrow animate-rise">
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-caret rounded-full bg-pulse align-middle" />
              estúdio de arquitetura · ia no navegador
            </p>
            <h1
              className="mt-5 animate-rise font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl"
              style={{ animationDelay: '80ms' }}
            >
              A arquitetura{' '}
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#0891b2] bg-clip-text text-transparent">
                se desenha
              </span>{' '}
              enquanto você conversa.
            </h1>
            <p className="mt-6 animate-rise text-lg leading-relaxed text-dim" style={{ animationDelay: '160ms' }}>
              Descreva o sistema em português. O assistente discute trade-offs e desenha o diagrama
              na hora — e do desenho validado nasce a infraestrutura, em AWS CDK ou Terraform.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise" style={{ animationDelay: '240ms' }}>
              <Link
                href="/register"
                className="btn-focus inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] px-6 py-3 font-semibold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.65)] transition hover:brightness-110"
              >
                Começar grátis <ArrowRight size={17} />
              </Link>
              <Link
                href="/login"
                className="btn-focus rounded-xl border border-border bg-panel px-6 py-3 font-semibold text-ink shadow-sm transition hover:border-accent/50"
              >
                Já tenho conta
              </Link>
            </div>
            <p className="mt-4 animate-rise font-mono text-xs text-dim/80" style={{ animationDelay: '320ms' }}>
              grátis · sem cartão · traga sua própria chave de API
            </p>
          </div>

          <div className="relative" data-depth="-0.03">
            <Hero3D light className="h-[420px] w-full sm:h-[500px] lg:h-[620px]" />
            {/* componentes pairando em profundidades diferentes */}
            <FloatChip icon={Cloud} label="CloudFront" className="left-[4%] top-[10%] max-lg:hidden" mouse="0.9" />
            <FloatChip icon={Database} label="Postgres" className="right-[2%] top-[28%] max-lg:hidden" mouse="1.4" delay="-2.4s" />
            <FloatChip icon={Bot} label="Agente IA" className="left-[10%] bottom-[30%] max-lg:hidden" mouse="1.8" delay="-4.2s" />
            <FloatChip icon={Boxes} label="Kubernetes" className="right-[14%] bottom-[12%] max-lg:hidden" mouse="0.7" delay="-5.6s" />
          </div>
        </section>

        {/* ---------- provedores ---------- */}
        <section className="border-y border-border/70 bg-panel/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-5 font-mono text-xs text-dim sm:px-8">
            <span className="eyebrow mr-2">funciona com a sua chave</span>
            {['OpenAI', 'Claude', 'Gemini', 'Groq', 'Mistral', 'DeepSeek', 'OpenRouter', 'Ollama'].map((p) => (
              <span key={p} className="transition hover:text-ink">{p}</span>
            ))}
          </div>
        </section>

        {/* ---------- pipeline: conversa → desenho → infra ---------- */}
        <section id="fluxo" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal>
            <p className="eyebrow">o fluxo</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Da conversa à infraestrutura, sem sair da prancheta
            </h2>
          </Reveal>

          <div className="mt-12 grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {/* 1 · conversa */}
            <Reveal className="h-full">
              <div className="tilt flex h-full flex-col rounded-2xl border border-border bg-panel p-6 shadow-[0_18px_44px_-22px_rgba(124,58,237,0.3)]">
                <p className="eyebrow flex items-center gap-2 text-accent">
                  <MessagesSquare size={14} /> conversa
                </p>
                <h3 className="mt-2 font-semibold">Você descreve, ele projeta</h3>
                <div className="mt-5 flex-1 space-y-3 text-[13px]">
                  <div className="ml-auto w-fit max-w-[95%] rounded-2xl rounded-br-md bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] px-3 py-2 text-white">
                    preciso de uma fila entre o checkout e o pagamento
                  </div>
                  <div className="w-fit max-w-[95%] rounded-2xl rounded-bl-md border border-border bg-panel2 px-3 py-2 text-ink">
                    Adicionei uma SQS entre a λ de checkout e o worker — desacopla e absorve picos.
                    <span className="mt-1 block font-mono text-xs text-sless">✓ aplicado ao desenho</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <FlowArrow />

            {/* 2 · desenho */}
            <Reveal className="h-full" delay={120}>
              <div className="tilt flex h-full flex-col rounded-2xl border border-border bg-panel p-6 shadow-[0_18px_44px_-22px_rgba(8,145,178,0.35)]">
                <p className="eyebrow flex items-center gap-2 text-pulse">
                  <PenTool size={14} /> desenho
                </p>
                <h3 className="mt-2 font-semibold">O diagrama acontece na hora</h3>
                <div className="grid-bg mt-5 flex-1 rounded-xl border border-border/70 bg-void p-3">
                  <svg viewBox="0 0 260 120" className="h-full w-full" role="img" aria-label="Mini diagrama: gateway, lambda, fila SQS e banco conectados">
                    {[
                      { x: 8, y: 42, w: 56, label: 'gateway', c: '#4f6ef7' },
                      { x: 96, y: 14, w: 62, label: 'λ checkout', c: '#7c3aed' },
                      { x: 96, y: 76, w: 56, label: 'sqs fila', c: '#d97706' },
                      { x: 192, y: 42, w: 60, label: 'postgres', c: '#0891b2' },
                    ].map((n) => (
                      <g key={n.label}>
                        <rect x={n.x} y={n.y} width={n.w} height={26} rx={7} fill={`${n.c}14`} stroke={n.c} strokeWidth="1.2" />
                        <text x={n.x + n.w / 2} y={n.y + 17} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="#1e1b2e">
                          {n.label}
                        </text>
                      </g>
                    ))}
                    {[
                      'M64 52 C 80 44, 84 32, 96 28',
                      'M64 58 C 80 66, 84 82, 96 88',
                      'M158 28 C 176 34, 180 44, 192 50',
                      'M152 88 C 172 82, 180 66, 192 58',
                    ].map((d) => (
                      <path key={d} d={d} fill="none" stroke="#0891b2" strokeOpacity="0.65" strokeWidth="1.3" strokeDasharray="4 6" className="animate-dash" />
                    ))}
                  </svg>
                </div>
              </div>
            </Reveal>

            <FlowArrow />

            {/* 3 · infra */}
            <Reveal className="h-full" delay={240}>
              <div className="tilt flex h-full flex-col rounded-2xl border border-border bg-panel p-6 shadow-[0_18px_44px_-22px_rgba(217,119,6,0.3)]">
                <p className="eyebrow flex items-center gap-2 text-aws">
                  <Braces size={14} /> infraestrutura
                </p>
                <h3 className="mt-2 font-semibold">O desenho vira CDK ou Terraform</h3>
                <pre className="mt-5 flex-1 overflow-x-auto rounded-xl bg-[#0b0e1a] p-4 font-mono text-xs leading-relaxed text-[#8d93b8]">
                  <code>
                    <span className="text-[#ffb454]">resource</span> <span className="text-[#4ade80]">&quot;aws_sqs_queue&quot;</span> <span className="text-[#4ade80]">&quot;fila&quot;</span> {'{'}{'\n'}
                    {'  '}name = <span className="text-[#4ade80]">&quot;pedidos&quot;</span>{'\n'}
                    {'}'}{'\n'}
                    <span className="text-[#ffb454]">resource</span> <span className="text-[#4ade80]">&quot;aws_lambda_function&quot;</span> <span className="text-[#4ade80]">&quot;checkout&quot;</span> {'{'}{'\n'}
                    {'  '}handler = <span className="text-[#4ade80]">&quot;index.handler&quot;</span>{'\n'}
                    {'  '}<span className="opacity-60"># IAM derivado das setas do desenho</span>{'\n'}
                    {'}'}
                  </code>
                </pre>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- catálogo ---------- */}
        <section id="catalogo" className="border-y border-border/70 bg-panel2/50 py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">o catálogo</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Mais de 100 componentes de verdade
                </h2>
              </div>
              <p className="max-w-sm text-sm text-dim">
                AWS, GCP, Azure, on-premise — e uma seção inteira de IA: agentes, RAG, MCP, vetores.
              </p>
            </Reveal>
          </div>
          <div className="space-y-3">
            <ChipRow items={CHIPS_AWS} dot="bg-aws" duration="52s" />
            <ChipRow items={CHIPS_CLOUD} dot="bg-pulse" duration="46s" reverse />
            <ChipRow items={CHIPS_IA} dot="bg-accent" duration="58s" />
          </div>
        </section>

        {/* ---------- privacidade / BYOK ---------- */}
        <section id="privacidade" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <Reveal>
            <p className="eyebrow">sua conta, suas regras</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Privado por padrão, do desenho à chave
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [KeyRound, 'Sua chave de API', 'Guardada cifrada com AES-256-GCM e usada só para o assistente desenhar em seu nome.'],
              [FolderLock, 'Projetos privados', 'Cada diagrama pertence à sua conta. Nada é público a menos que você exporte.'],
              [ImageDown, 'Export livre', 'PNG, SVG e link compartilhável — o desenho é seu, leve para onde quiser.'],
              [BrainCircuit, '8 provedores de IA', 'OpenAI, Claude, Gemini, Groq, Mistral, DeepSeek, OpenRouter ou seu Ollama local.'],
            ].map(([Icon, title, body]: any, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="tilt h-full rounded-2xl border border-border bg-panel p-6 shadow-[0_18px_44px_-24px_rgba(124,58,237,0.25)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon size={19} />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dim">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- CTA final ---------- */}
        <section id="comecar" className="relative overflow-hidden border-t border-border/70 py-28">
          <div className="floor-3d" aria-hidden />
          <div
            aria-hidden
            data-depth="0.1"
            className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ddd6fe, transparent 65%)' }}
          />
          <Reveal className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
            <div className="mb-6 flex justify-center">
              <span className="animate-floaty inline-block"><Mark size={44} /></span>
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Abra a{' '}
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#0891b2] bg-clip-text text-transparent">prancheta</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-dim">
              Em um minuto você descreve o primeiro sistema — e vê o desenho acontecer.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/register"
                className="btn-focus inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.65)] transition hover:brightness-110"
              >
                Criar conta grátis <ArrowRight size={17} />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ---------- rodapé ---------- */}
        <footer className="border-t border-border/70 bg-panel/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8 text-sm text-dim sm:px-8">
            <Logo className="text-base" />
            <span className="hidden sm:inline">—</span>
            <span>feito para humanos e agentes de IA</span>
            <div className="flex-1" />
            <a
              href="https://archstudio.mjolnix.com.br"
              className="btn-focus inline-flex items-center gap-1.5 rounded font-mono text-xs transition hover:text-ink"
            >
              <Workflow size={13} /> motor do canvas: open source
            </a>
          </div>
        </footer>
      </ParallaxField>
    </div>
  );
}
