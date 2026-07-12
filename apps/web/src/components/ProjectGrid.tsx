'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/client';
import { Button } from '@/components/ui';
import type { ProjectMeta } from '@/lib/types';

const EMPTY_DOC = {
  format: 'archstudio',
  version: 3,
  state: { seq: 0, nodes: [], edges: [], boxes: [], arrows: [], texts: [] },
};

function rel(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}

/**
 * Miniatura viva: um mini-diagrama determinístico gerado do id do projeto,
 * para cada card ter um desenho só seu (sem depender de thumbnail salvo).
 */
function Thumb({ seedStr }: { seedStr: string }) {
  let seed = 2166136261;
  for (const ch of seedStr) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const colors = ['#a679ff', '#5ee7ff', '#ffb454', '#7c9cff'];
  const n = 4 + Math.floor(rand() * 2);
  const nodes = Array.from({ length: n }, (_, i) => ({
    x: 14 + (i / n) * 180 + rand() * 26,
    y: 16 + rand() * 52,
    w: 34 + rand() * 22,
    c: colors[Math.floor(rand() * colors.length)],
  }));
  return (
    <svg viewBox="0 0 240 96" className="h-full w-full" aria-hidden>
      {nodes.slice(1).map((b, i) => {
        const a = nodes[i];
        return (
          <path
            key={i}
            d={`M${a.x + a.w} ${a.y + 7} C ${(a.x + b.x) / 2} ${a.y + 7}, ${(a.x + b.x) / 2} ${b.y + 7}, ${b.x} ${b.y + 7}`}
            fill="none"
            stroke="#5ee7ff"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            strokeDasharray="3 5"
          />
        );
      })}
      {nodes.map((nd, i) => (
        <rect
          key={i}
          x={nd.x}
          y={nd.y}
          width={nd.w}
          height={14}
          rx={4}
          fill={`${nd.c}26`}
          stroke={nd.c}
          strokeOpacity="0.8"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export function ProjectGrid({ initial }: { initial: ProjectMeta[] }) {
  const router = useRouter();
  const [items, setItems] = useState<ProjectMeta[]>(initial);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const p = await api<ProjectMeta>('/projects', {
        method: 'POST',
        body: { name: 'Novo diagrama', doc: EMPTY_DOC },
      });
      router.push('/app/editor/' + p.id);
    } catch (e: any) {
      alert(e.message || 'Falha ao criar');
    } finally {
      setBusy(false);
    }
  }

  async function rename(p: ProjectMeta) {
    const name = prompt('Nome do diagrama:', p.name);
    if (name == null) return;
    try {
      await api('/projects/' + p.id, { method: 'PUT', body: { name } });
      setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, name } : x)));
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function duplicate(p: ProjectMeta) {
    try {
      const full = await api<any>('/projects/' + p.id);
      const copy = await api<ProjectMeta>('/projects', {
        method: 'POST',
        body: { name: p.name + ' (cópia)', doc: full.doc || EMPTY_DOC },
      });
      setItems((xs) => [copy, ...xs]);
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function remove(p: ProjectMeta) {
    if (!confirm(`Excluir "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api('/projects/' + p.id, { method: 'DELETE' });
      setItems((xs) => xs.filter((x) => x.id !== p.id));
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <button
        onClick={create}
        disabled={busy}
        className="btn-focus tilt flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-panel/30 text-dim transition hover:border-accent hover:text-accent"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-current">
          <Plus size={22} />
        </span>
        <span className="mt-3 text-sm font-medium">Novo diagrama</span>
        <span className="mt-1 font-mono text-xs opacity-70">a prancheta em branco</span>
      </button>

      {items.map((p) => (
        <div
          key={p.id}
          className="tilt group relative overflow-hidden rounded-2xl border border-border bg-panel transition hover:border-accent/60"
        >
          <a href={'/app/editor/' + p.id} className="btn-focus block rounded-2xl">
            <div className="grid-bg h-24 border-b border-border/60 bg-void/40 p-2">
              <Thumb seedStr={p.id} />
            </div>
            <div className="p-4">
              <div className="truncate font-semibold">{p.name}</div>
              <div className="mt-0.5 font-mono text-xs text-dim">editado {rel(p.updatedAt)}</div>
            </div>
          </a>
          <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
            <Button variant="ghost" className="px-2 py-1.5" title="Renomear" aria-label="Renomear" onClick={() => rename(p)}>
              <Pencil size={13} />
            </Button>
            <Button variant="ghost" className="px-2 py-1.5" title="Duplicar" aria-label="Duplicar" onClick={() => duplicate(p)}>
              <Copy size={13} />
            </Button>
            <Button variant="danger" className="px-2 py-1.5" title="Excluir" aria-label="Excluir" onClick={() => remove(p)}>
              <Trash2 size={13} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
