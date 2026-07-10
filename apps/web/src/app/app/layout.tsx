import { redirect } from 'next/navigation';
import { getMe } from '@/lib/server';
import { TopNav } from '@/components/TopNav';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect('/login');
  return (
    <div className="min-h-screen">
      <TopNav userName={me.name} />
      {children}
    </div>
  );
}
