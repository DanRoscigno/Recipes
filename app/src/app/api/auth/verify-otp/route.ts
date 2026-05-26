import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyOtpToken, signSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { code } = await request.json().catch(() => ({}));

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const otpToken = cookieStore.get('otp_token')?.value;

  if (!otpToken) {
    return NextResponse.json({ error: 'OTP session expired, please request a new code' }, { status: 400 });
  }

  const payload = await verifyOtpToken(otpToken);
  if (!payload) {
    return NextResponse.json({ error: 'Code expired, please request a new one' }, { status: 401 });
  }

  if (payload.otp !== String(code).trim()) {
    return NextResponse.json({ error: 'Incorrect code' }, { status: 401 });
  }

  const sessionToken = await signSessionToken(payload.email);

  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  cookieStore.delete('otp_token');
  return NextResponse.json({ ok: true, email: payload.email });
}
