import { apiServer } from '@/lib/server';
import { ProjectGrid } from '@/components/ProjectGrid';
import type { ProjectMeta } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const r = await apiServer('/projects');
  const projects: ProjectMeta[] = r.ok && Array.isArray(r.data) ? r.data : [];
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus diagramas</h1>
          <p className="text-sm text-dim">Cada diagrama é privado da sua conta.</p>
        </div>
      </div>
      <ProjectGrid initial={projects} />
    </main>
  );
}
