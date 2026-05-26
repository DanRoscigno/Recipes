import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { isEmailAllowed, signOtpToken } from '@/lib/auth';

const FROM = process.env.RESEND_FROM ?? 'noreply@roscigno.com';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(process.env.RESEND_API_KEY);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  if (!isEmailAllowed(normalized)) {
    return NextResponse.json({ error: 'Email domain not allowed' }, { status: 403 });
  }

  const otp = generateOtp();
  const token = await signOtpToken(normalized, otp);

  try {
    await getResend().emails.send({
      from: FROM,
      to: normalized,
      subject: 'Your recipe app login code',
      text: `Your login code is: ${otp}\n\nThis code expires in 10 minutes.`,
      html: `<p>Your login code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set('otp_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return NextResponse.json({ ok: true });
}
