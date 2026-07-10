import { cookies } from 'next/headers';
import type { User } from './types';

const BASE = () => process.env.API_INTERNAL_URL || 'http://api:8090';

export async function apiServer<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  const cookie = cookies().toString();
  const res = await fetch(BASE() + '/api/v1' + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
      Cookie: cookie,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { ok: res.ok, status: res.status, data };
}

export async function getMe(): Promise<User | null> {
  try {
    const r = await apiServer('/me');
    return r.ok ? (r.data as User) : null;
  } catch {
    return null;
  }
}
