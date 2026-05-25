import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpToken, signSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { code } = await request.json().catch(() => ({}));
  const otpToken = request.cookies.get('otp_token')?.value;

  if (!code || !otpToken) {
    return NextResponse.json({ error: 'Missing code or session' }, { status: 400 });
  }

  const payload = await verifyOtpToken(otpToken);
  if (!payload) {
    return NextResponse.json({ error: 'Code expired, please request a new one' }, { status: 401 });
  }

  if (payload.otp !== String(code).trim()) {
    return NextResponse.json({ error: 'Incorrect code' }, { status: 401 });
  }

  const sessionToken = await signSessionToken(payload.email);

  const response = NextResponse.json({ ok: true, email: payload.email });
  response.cookies.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  response.cookies.delete('otp_token');
  return response;
}
