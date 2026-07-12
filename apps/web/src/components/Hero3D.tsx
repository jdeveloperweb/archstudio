'use client';
/**
 * A prancheta viva: uma cena 3D desenhada à mão em canvas 2D (projeção em
 * perspectiva própria, zero dependências) onde diagramas de arquitetura se
 * montam sozinhos, sincronizados com um prompt digitado — o produto
 * acontecendo diante do visitante.
 *
 * A altura (y) codifica a camada real da stack: borda no topo, aplicação no
 * meio, dados no chão da prancheta.
 */
import { useEffect, useRef, useState } from 'react';
import { Mark } from './Brand';

type Cat = 'network' | 'compute' | 'data' | 'queue' | 'ai';

type SceneNode = {
  id: string;
  label: string;
  cat: Cat;
  x: number; // lateral
  z: number; // profundidade
  y: number; // camada: 0 = dados, 65 = aplicação, 130 = borda
  w?: number;
  d?: number;
};

type Scenario = { prompt: string; nodes: SceneNode[]; edges: [string, string][] };

const CAT_COLOR: Record<Cat, string> = {
  network: '#7c9cff',
  compute: '#a679ff',
  data: '#5ee7ff',
  queue: '#ffb454',
  ai: '#d8b4fe',
};

const SCENARIOS: Scenario[] = [
  {
    prompt: 'desenhe um checkout resiliente na AWS',
    nodes: [
      { id: 'cf', label: 'CloudFront', cat: 'network', x: -175, z: -20, y: 130 },
      { id: 'gw', label: 'API Gateway', cat: 'network', x: -80, z: 30, y: 65 },
      { id: 'fn', label: 'λ Checkout', cat: 'compute', x: 35, z: -55, y: 65 },
      { id: 'q', label: 'SQS pedidos', cat: 'queue', x: 55, z: 75, y: 65 },
      { id: 'wk', label: 'Worker pagto', cat: 'compute', x: 165, z: 30, y: 65 },
      { id: 'db', label: 'RDS Postgres', cat: 'data', x: 150, z: -80, y: 0 },
    ],
    edges: [
      ['cf', 'gw'],
      ['gw', 'fn'],
      ['fn', 'q'],
      ['q', 'wk'],
      ['wk', 'db'],
      ['fn', 'db'],
    ],
  },
  {
    prompt: 'agora adicione um agente de IA com RAG',
    nodes: [
      { id: 'web', label: 'Front Next.js', cat: 'compute', x: -170, z: 25, y: 65 },
      { id: 'ag', label: 'Agente IA', cat: 'ai', x: -45, z: -35, y: 130 },
      { id: 'llm', label: 'LLM gateway', cat: 'ai', x: 85, z: -85, y: 130 },
      { id: 'mcp', label: 'MCP tools', cat: 'ai', x: 110, z: 20, y: 130 },
      { id: 'vec', label: 'Vector DB', cat: 'data', x: 20, z: 100, y: 0 },
      { id: 'pg', label: 'Postgres', cat: 'data', x: 175, z: 95, y: 0 },
    ],
    edges: [
      ['web', 'ag'],
      ['ag', 'llm'],
      ['ag', 'mcp'],
      ['ag', 'vec'],
      ['mcp', 'pg'],
    ],
  },
  {
    prompt: 'desenhe um cluster k8s com cache e filas',
    nodes: [
      { id: 'ing', label: 'Ingress', cat: 'network', x: -165, z: -35, y: 130 },
      { id: 'api', label: 'API pods', cat: 'compute', x: -55, z: -65, y: 65 },
      { id: 'rd', label: 'Redis cache', cat: 'data', x: -25, z: 70, y: 65 },
      { id: 'kf', label: 'Kafka', cat: 'queue', x: 105, z: 5, y: 65 },
      { id: 'cs', label: 'Consumer pods', cat: 'compute', x: 180, z: -70, y: 65 },
      { id: 'pg', label: 'Postgres', cat: 'data', x: 135, z: 105, y: 0 },
    ],
    edges: [
      ['ing', 'api'],
      ['api', 'rd'],
      ['api', 'kf'],
      ['kf', 'cs'],
      ['cs', 'pg'],
    ],
  },
];

/* ---------- linha do tempo de cada cenário ---------- */
const CHAR_S = 0.04; // digitação
const TYPE_LEAD = 0.5; // pausa antes de digitar
const SEND_PAUSE = 0.55; // pausa após "enviar"
const NODE_STAGGER = 0.24;
const NODE_POP = 0.55;
const EDGE_LAG = 0.28;
const EDGE_DRAW = 0.5;
const HOLD = 5.2;
const FADE = 0.7;

function timings(sc: Scenario) {
  const typeEnd = TYPE_LEAD + sc.prompt.length * CHAR_S;
  const buildStart = typeEnd + SEND_PAUSE;
  const nodeAt = (i: number) => buildStart + i * NODE_STAGGER;
  const lastNode = nodeAt(sc.nodes.length - 1) + NODE_POP;
  const edgeAt = (e: [string, string]) => {
    const ia = sc.nodes.findIndex((n) => n.id === e[0]);
    const ib = sc.nodes.findIndex((n) => n.id === e[1]);
    return Math.max(nodeAt(ia), nodeAt(ib)) + EDGE_LAG;
  };
  const lastEdge = Math.max(...sc.edges.map((e) => edgeAt(e))) + EDGE_DRAW;
  const fadeStart = Math.max(lastNode, lastEdge) + HOLD;
  return { typeEnd, buildStart, nodeAt, edgeAt, fadeStart, total: fadeStart + FADE };
}

/* ---------- easings ---------- */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Chip = { typed: string; state: 'typing' | 'thinking' | 'applied' };

export function Hero3D({ className = '', light = false }: { className?: string; light?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chip, setChip] = useState<Chip>({ typed: '', state: 'typing' });

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* paleta da cena: estúdio escuro ou entrada clara */
    const P = light
      ? {
          cat: { network: '#4f6ef7', compute: '#7c3aed', data: '#0891b2', queue: '#d97706', ai: '#c026d3' } as Record<Cat, string>,
          grid: 'rgba(124,58,237,0.15)',
          fade0: 'rgba(250,250,255,0)',
          fade1: 'rgba(250,250,255,0.97)',
          edgeRGB: '8,145,178',
          edgeA: 0.55,
          pulse: '#0891b2',
          label: '30,27,46',
          labelShadow: 'rgba(255,255,255,0.95)',
          shadowRGB: '30,27,46',
          shadowA: 0.16,
        }
      : {
          cat: CAT_COLOR,
          grid: 'rgba(166,121,255,0.10)',
          fade0: 'rgba(11,14,26,0)',
          fade1: 'rgba(11,14,26,0.96)',
          edgeRGB: '94,231,255',
          edgeA: 0.4,
          pulse: '#5ee7ff',
          label: '237,239,250',
          labelShadow: 'rgba(6,7,13,0.9)',
          shadowRGB: '6,7,13',
          shadowA: 0.32,
        };

    let W = 0;
    let H = 0;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    // ?heroT=8 pula a linha do tempo (depuração visual/screenshots)
    const debugT = Number(new URLSearchParams(window.location.search).get('heroT')) || 0;
    let sceneT = reduced ? Number.POSITIVE_INFINITY : debugT; // reduzido: cena montada
    let scIdx = 0;
    const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
    let lastChipKey = '';

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      const d = dpr();
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(d, 0, 0, d, 0, 0);
      if (reduced) drawFrame(0);
    }

    /* ---------- projeção ---------- */
    const F = 760;
    function view(x: number, y: number, z: number, yaw: number, pitch: number) {
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const x1 = x * cy - z * sy;
      const z1 = x * sy + z * cy;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      return { x: x1, y: y2, z: z2 };
    }
    function proj(v: { x: number; y: number; z: number }, unit: number) {
      const k = F / (F + v.z);
      return { x: W / 2 + v.x * k * unit, y: H * 0.56 - v.y * k * unit, k };
    }

    function hexA(hex: string, a: number) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    function drawFrame(dt: number) {
      ctx.clearRect(0, 0, W, H);
      const sc = SCENARIOS[scIdx];
      const tm = timings(sc);
      const t = Math.min(sceneT, tm.total);
      const unit = Math.min(W / 640, H / 540);

      // deriva suave + ponteiro (interpolado)
      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);
      const wob = reduced ? 0 : Math.sin(sceneT * 0.4) * 0.07;
      const yaw = -0.52 + wob + pointer.x * 0.28;
      const pitch = -0.42 + pointer.y * 0.12;

      const fade = t > tm.fadeStart ? 1 - clamp01((t - tm.fadeStart) / FADE) : 1;

      /* chão: grade da prancheta */
      ctx.lineWidth = 1;
      const R = 250;
      const STEP = 50;
      for (let i = -R; i <= R; i += STEP) {
        const a1 = proj(view(i, 0, -R, yaw, pitch), unit);
        const a2 = proj(view(i, 0, R, yaw, pitch), unit);
        const b1 = proj(view(-R, 0, i, yaw, pitch), unit);
        const b2 = proj(view(R, 0, i, yaw, pitch), unit);
        ctx.strokeStyle = P.grid;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.moveTo(b1.x, b1.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.stroke();
      }
      // esmaece a grade nas bordas
      const g = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.18, W / 2, H * 0.55, Math.max(W, H) * 0.62);
      g.addColorStop(0, P.fade0);
      g.addColorStop(1, P.fade1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      /* progresso de cada nó/aresta */
      const nodeP = new Map<string, number>();
      sc.nodes.forEach((n, i) => {
        nodeP.set(n.id, clamp01((t - tm.nodeAt(i)) / NODE_POP));
      });
      const pos = new Map<string, { x: number; y: number; z: number }>();
      sc.nodes.forEach((n, i) => {
        const p = nodeP.get(n.id)!;
        const drop = (1 - easeOutCubic(p)) * 90;
        const bob = reduced || p < 1 ? 0 : Math.sin(sceneT * 1.6 + i * 1.7) * 2.5;
        pos.set(n.id, { x: n.x, y: n.y + drop + bob, z: n.z });
      });

      /* sombras no chão */
      sc.nodes.forEach((n) => {
        const p = nodeP.get(n.id)!;
        if (p <= 0) return;
        const s = proj(view(n.x, 0, n.z, yaw, pitch), unit);
        const w = ((n.w ?? 88) / 2) * s.k * unit * easeOutBack(p);
        ctx.fillStyle = `rgba(${P.shadowRGB},${P.shadowA * p * fade})`;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, Math.max(2, w), Math.max(1, w * 0.34), 0, 0, Math.PI * 2);
        ctx.fill();
      });

      /* arestas (com pulsos de dados) */
      sc.edges.forEach((e, ei) => {
        const start = tm.edgeAt(e);
        const p = clamp01((t - start) / EDGE_DRAW);
        if (p <= 0) return;
        const A = pos.get(e[0])!;
        const B = pos.get(e[1])!;
        const mid = { x: (A.x + B.x) / 2, y: Math.max(A.y, B.y) + 34, z: (A.z + B.z) / 2 };
        const N = 26;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= N * p; i++) {
          const u = i / N;
          const iu = 1 - u;
          const wx = iu * iu * A.x + 2 * iu * u * mid.x + u * u * B.x;
          const wy = iu * iu * A.y + 2 * iu * u * mid.y + u * u * B.y;
          const wz = iu * iu * A.z + 2 * iu * u * mid.z + u * u * B.z;
          pts.push(proj(view(wx, wy, wz, yaw, pitch), unit));
        }
        ctx.strokeStyle = `rgba(${P.edgeRGB},${P.edgeA * fade})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
        ctx.stroke();

        // pulsos viajando na aresta completa
        if (p >= 1 && !reduced) {
          for (let k = 0; k < 2; k++) {
            const u = (sceneT * 0.28 + ei * 0.37 + k * 0.5) % 1;
            const iu = 1 - u;
            const wx = iu * iu * A.x + 2 * iu * u * mid.x + u * u * B.x;
            const wy = iu * iu * A.y + 2 * iu * u * mid.y + u * u * B.y;
            const wz = iu * iu * A.z + 2 * iu * u * mid.z + u * u * B.z;
            const s = proj(view(wx, wy, wz, yaw, pitch), unit);
            ctx.save();
            ctx.shadowColor = P.pulse;
            ctx.shadowBlur = 10;
            ctx.fillStyle = `rgba(${P.edgeRGB},${0.95 * fade})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 2.4 * s.k, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      });

      /* nós: caixas extrudadas holográficas (pintor: fundo → frente) */
      const order = [...sc.nodes].sort((a, b) => {
        const va = view(a.x, a.y, a.z, yaw, pitch);
        const vb = view(b.x, b.y, b.z, yaw, pitch);
        return vb.z - va.z;
      });
      order.forEach((n) => {
        const p = nodeP.get(n.id)!;
        if (p <= 0) return;
        const scale = easeOutBack(p);
        const c = pos.get(n.id)!;
        const w = ((n.w ?? 88) / 2) * scale;
        const d = ((n.d ?? 56) / 2) * scale;
        const h = 11 * scale;
        const col = P.cat[n.cat];
        const alpha = p * fade;

        // pino ancorando o nó à prancheta
        if (n.y > 4) {
          const pinTop = proj(view(c.x, c.y - h, c.z, yaw, pitch), unit);
          const pinBase = proj(view(c.x, 0, c.z, yaw, pitch), unit);
          ctx.setLineDash([3, 5]);
          ctx.strokeStyle = hexA(col, 0.28 * alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pinTop.x, pinTop.y);
          ctx.lineTo(pinBase.x, pinBase.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 8 cantos da caixa
        const corner = (sx: number, sy: number, sz: number) =>
          proj(view(c.x + sx * w, c.y + sy * h, c.z + sz * d, yaw, pitch), unit);
        const faces: { pts: [number, number, number][]; normal: [number, number, number]; fill: number }[] = [
          { pts: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], normal: [0, 1, 0], fill: 0.3 },
          { pts: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]], normal: [0, 0, -1], fill: 0.16 },
          { pts: [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]], normal: [1, 0, 0], fill: 0.12 },
          { pts: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], normal: [0, 0, 1], fill: 0.16 },
          { pts: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], normal: [-1, 0, 0], fill: 0.12 },
        ];
        faces.forEach((f) => {
          const nv = view(f.normal[0], f.normal[1], f.normal[2], yaw, pitch);
          if (f.normal[1] !== 1 && nv.z > 0) return; // face de costas
          const pts = f.pts.map(([sx, sy, sz]) => corner(sx, sy, sz));
          ctx.fillStyle = hexA(col, f.fill * alpha);
          ctx.strokeStyle = hexA(col, 0.75 * alpha);
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      });

      /* rótulos num passe final — sempre legíveis, nunca atrás de uma caixa */
      order.forEach((n) => {
        const p = nodeP.get(n.id)!;
        if (p <= 0) return;
        const c = pos.get(n.id)!;
        const h = 11 * easeOutBack(p);
        const col = P.cat[n.cat];
        const alpha = p * fade;
        const top = proj(view(c.x, c.y + h + 16, c.z, yaw, pitch), unit);
        const fs = Math.max(9, 11.5 * top.k * Math.min(1.15, unit));
        ctx.font = `500 ${fs}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = P.labelShadow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(${P.label},${0.92 * alpha})`;
        ctx.fillText(n.label, top.x + 4, top.y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = hexA(col, alpha);
        ctx.beginPath();
        ctx.arc(top.x - ctx.measureText(n.label).width / 2 - 7, top.y - fs * 0.36, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    /* ---------- estado do chip de chat ---------- */
    function syncChip() {
      const sc = SCENARIOS[scIdx];
      const tm = timings(sc);
      const t = Math.min(sceneT, tm.total);
      const chars = reduced
        ? sc.prompt.length
        : Math.min(sc.prompt.length, Math.max(0, Math.floor((t - TYPE_LEAD) / CHAR_S)));
      const state: Chip['state'] =
        reduced || t >= tm.buildStart + (tm.fadeStart - tm.buildStart) * 0.55
          ? 'applied'
          : t >= tm.typeEnd + SEND_PAUSE * 0.4
            ? 'thinking'
            : 'typing';
      const key = `${scIdx}:${chars}:${state}`;
      if (key !== lastChipKey) {
        lastChipKey = key;
        setChip({ typed: sc.prompt.slice(0, chars), state });
      }
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      sceneT += dt;
      const tm = timings(SCENARIOS[scIdx]);
      if (sceneT >= tm.total) {
        sceneT = 0;
        scIdx = (scIdx + 1) % SCENARIOS.length;
      }
      syncChip();
      drawFrame(dt);
    }

    function onPointer(e: PointerEvent) {
      const r = wrap.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    function onLeave() {
      pointer.tx = 0;
      pointer.ty = 0;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
    });
    io.observe(wrap);

    if (reduced) {
      syncChip();
      drawFrame(0);
    } else {
      // primeiro frame síncrono: sem flash de canvas vazio antes do RAF
      syncChip();
      drawFrame(0);
      wrap.addEventListener('pointermove', onPointer);
      wrap.addEventListener('pointerleave', onLeave);
      raf = requestAnimationFrame((n) => {
        last = n;
        tick(n);
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointermove', onPointer);
      wrap.removeEventListener('pointerleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [light]);

  return (
    <div
      ref={wrapRef}
      className={`relative ${className}`}
      role="img"
      aria-label="Demonstração animada: um prompt em português é digitado e um diagrama de arquitetura 3D se desenha sozinho, camada por camada."
    >
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0" />

      {/* conversa que comanda o desenho */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col items-start gap-2 sm:inset-x-8 sm:bottom-7">
        <div className="glass flex max-w-full items-center gap-2 rounded-2xl rounded-bl-md px-3.5 py-2 font-mono text-[13px] text-ink shadow-lg">
          <span className="text-accent">›</span>
          <span className="truncate">{chip.typed}</span>
          {chip.state === 'typing' && <span className="-ml-1 animate-caret text-pulse">▍</span>}
        </div>
        <div
          className={`flex items-center gap-2 rounded-2xl rounded-bl-md border px-3.5 py-2 text-[13px] shadow-lg transition-all duration-500 ${
            chip.state === 'typing'
              ? 'translate-y-1 border-transparent bg-transparent opacity-0'
              : 'translate-y-0 border-accent/30 bg-accent/10 opacity-100 backdrop-blur-md'
          }`}
        >
          <Mark size={15} />
          {chip.state === 'applied' ? (
            <span className="text-sless">✓ aplicado ao desenho</span>
          ) : (
            <span className="text-dim">
              desenhando
              <span className="animate-caret">…</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
