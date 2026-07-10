import { EditorClient } from '@/components/EditorClient';

export const dynamic = 'force-dynamic';

export default function EditorPage({ params }: { params: { id: string } }) {
  return <EditorClient id={params.id} />;
}
