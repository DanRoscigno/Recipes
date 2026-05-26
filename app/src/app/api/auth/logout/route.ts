import { NextResponse } from 'next/server';

export async function POST() {
  const isSecure = process.env.NODE_ENV === 'production';
  const secureStr = isSecure ? '; Secure' : '';
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', `session=; HttpOnly${secureStr}; SameSite=Lax; Max-Age=0; Path=/`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
