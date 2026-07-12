import { apiServer } from '@/lib/server';
import { ProjectGrid } from '@/components/ProjectGrid';
import type { ProjectMeta } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const r = await apiServer('/projects');
  const projects: ProjectMeta[] = r.ok && Array.isArray(r.data) ? r.data : [];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow">sua prancheta</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Meus diagramas</h1>
          <p className="mt-1 text-sm text-dim">
            {projects.length === 0
              ? 'Cada diagrama é privado da sua conta.'
              : `${projects.length} ${projects.length === 1 ? 'projeto privado' : 'projetos privados'} na sua conta.`}
          </p>
        </div>
      </div>
      <ProjectGrid initial={projects} />
    </main>
  );
}
