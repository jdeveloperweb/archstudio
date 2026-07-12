'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ShieldAlert, Trash2, UserRound } from 'lucide-react';
import { api } from '@/lib/client';
import { Button, Card, Field, Input } from '@/components/ui';
import type { User } from '@/lib/types';

/** Redimensiona a foto no cliente (máx. 256px, JPEG) e devolve um data URL. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const max = 256;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function ProfileSection({ me }: { me: User }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(me.name);
  const [avatar, setAvatar] = useState<string | null>(me.avatar ?? null);
  const [dirtyAvatar, setDirtyAvatar] = useState<string | null>(null); // null = sem mudança, '' = remover
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const url = await toAvatarDataUrl(f);
      setAvatar(url);
      setDirtyAvatar(url);
    } catch {
      setErr('Não foi possível ler a imagem.');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const body: any = { name };
      if (dirtyAvatar !== null) body.avatar = dirtyAvatar;
      await api<User>('/me', { method: 'PUT', body });
      setDirtyAvatar(null);
      setMsg('Perfil salvo.');
      router.refresh();
    } catch (e: any) {
      setErr(e.message || 'Falha ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <h2 className="flex items-center gap-2 font-semibold">
        <UserRound size={16} className="text-accent" /> Perfil
      </h2>
      <form onSubmit={save} className="mt-5 space-y-5">
        <div className="flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Sua foto" className="h-16 w-16 rounded-full border border-border object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-accent to-[#8b5cf6] font-display text-xl font-bold text-white">
              {name.trim().charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()}>
              <Camera size={14} /> {avatar ? 'Trocar foto' : 'Enviar foto'}
            </Button>
            {avatar && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setAvatar(null);
                  setDirtyAvatar('');
                }}
              >
                Remover
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          </div>
        </div>

        <Field label="Nome">
          <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        </Field>
        <Field label="E-mail" hint="O e-mail de acesso não pode ser alterado.">
          <Input value={me.email} disabled className="opacity-60" />
        </Field>

        {msg && <div className="text-sm text-sless">{msg}</div>}
        {err && <div className="text-sm text-red">{err}</div>}
        <Button type="submit" loading={loading}>Salvar perfil</Button>
      </form>
    </Card>
  );
}

export function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      await api('/me/password', { method: 'PUT', body: { current, next } });
      setCurrent('');
      setNext('');
      setMsg('Senha alterada.');
    } catch (e: any) {
      setErr(e.message || 'Falha ao alterar a senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <h2 className="flex items-center gap-2 font-semibold">
        <ShieldAlert size={16} className="text-pulse" /> Senha
      </h2>
      <form onSubmit={save} className="mt-5 space-y-4">
        <Field label="Senha atual">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
        </Field>
        <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
        </Field>
        {msg && <div className="text-sm text-sless">{msg}</div>}
        {err && <div className="text-sm text-red">{err}</div>}
        <Button type="submit" loading={loading}>Alterar senha</Button>
      </form>
    </Card>
  );
}

export function DangerSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function destroy(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api('/me', { method: 'DELETE', body: { password } });
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setErr(e.message || 'Falha ao excluir a conta');
      setLoading(false);
    }
  }

  return (
    <Card className="border-red/30 p-7">
      <h2 className="flex items-center gap-2 font-semibold text-red">
        <Trash2 size={16} /> Zona de perigo
      </h2>
      <p className="mt-2 text-sm text-dim">
        Excluir a conta apaga definitivamente todos os seus diagramas, configurações e a chave de
        API salva. Esta ação não pode ser desfeita.
      </p>
      {!open ? (
        <Button type="button" variant="danger" className="mt-4" onClick={() => setOpen(true)}>
          Excluir minha conta
        </Button>
      ) : (
        <form onSubmit={destroy} className="mt-4 space-y-4 rounded-xl border border-red/30 bg-red/5 p-4">
          <Field label="Confirme sua senha para excluir">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
            />
          </Field>
          {err && <div className="text-sm text-red">{err}</div>}
          <div className="flex gap-2">
            <Button type="submit" variant="danger" loading={loading}>
              Excluir definitivamente
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
