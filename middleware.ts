import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyToken } from './lib/jwt';
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const publicApi = ['/api/auth/login', '/api/auth/logout', '/api/seed'].includes(path);
  const token = req.cookies.get(COOKIE_NAME)?.value;
  let session = null;
  if (token) { try { session = await verifyToken(token); } catch { /* expired or invalid */ } }
  if (path === '/login' && session) return NextResponse.redirect(new URL('/dashboard', req.url));
  if ((path.startsWith('/dashboard') || (path.startsWith('/api/') && !publicApi)) && !session) {
    if (path.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (path === '/dashboard/transcript' && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*', '/api/:path*', '/login'] };
