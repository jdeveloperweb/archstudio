'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        className="flex min-h-[128px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-panel/40 text-dim transition hover:border-accent hover:text-accent"
      >
        <span className="text-3xl">＋</span>
        <span className="mt-1 text-sm font-medium">Novo diagrama</span>
      </button>

      {items.map((p) => (
        <div key={p.id} className="group relative rounded-2xl border border-border bg-panel p-4 transition hover:border-accent/60">
          <a href={'/app/editor/' + p.id} className="block">
            <div className="grid-bg mb-3 h-20 rounded-lg border border-border/60" />
            <div className="truncate font-semibold">{p.name}</div>
            <div className="text-xs text-dim">editado {rel(p.updatedAt)}</div>
          </a>
          <div className="mt-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => rename(p)}>✎</Button>
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => duplicate(p)}>⧉</Button>
            <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(p)}>🗑</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
