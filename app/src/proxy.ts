import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

const PROTECTED = [/^\/recipes\/[^/]+\/edit$/, /^\/recipes\/new$/];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED.some(p => p.test(pathname))) return NextResponse.next();

  const token = request.cookies.get('session')?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/recipes/:slug*/edit', '/recipes/new'],
};
