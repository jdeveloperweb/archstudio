import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Gate /app/* on presence of the session cookie. Full validation happens
// server-side in the layout (getMe) which redirects if the cookie is invalid.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('as_session');
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
