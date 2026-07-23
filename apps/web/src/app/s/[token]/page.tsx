import { GuestEditor } from '@/components/GuestEditor';

// Página pública do link de convite: qualquer pessoa com o link edita junto,
// em tempo real. Não passa pelo middleware de /app (é aberta de propósito).
export const metadata = { title: 'Colaborar — ArchStudio' };

export default function SharePage({ params }: { params: { token: string } }) {
  return <GuestEditor token={params.token} />;
}
