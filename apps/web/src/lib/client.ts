// Browser API helper. Calls same-origin /api/v1 with the session cookie.
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any } = {},
): Promise<T> {
  const res = await fetch('/api/v1' + path, {
    method: opts.method || 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let code = 'ERROR';
    let message = 'Erro inesperado';
    try {
      const j = await res.json();
      code = j.error || code;
      message = j.message || message;
    } catch {}
    throw new ApiError(code, message);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  return (ct.includes('application/json') ? res.json() : (undefined as any)) as T;
}
