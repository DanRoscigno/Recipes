import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyOtpToken, signSessionToken } from '@/lib/auth';

const isSecure = process.env.NODE_ENV === 'production';
const secureStr = isSecure ? '; Secure' : '';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  const { code } = await request.json().catch(() => ({}));

  if (!code) {
    return json({ error: 'Code is required' }, 400);
  }

  // cookies() reads from the incoming request — known to work for otp_token
  const cookieStore = await cookies();
  const otpToken = cookieStore.get('otp_token')?.value;

  if (!otpToken) {
    return json({ error: 'OTP session expired, please request a new code' }, 400);
  }

  const payload = await verifyOtpToken(otpToken);
  if (!payload) {
    return json({ error: 'Code expired, please request a new one' }, 401);
  }

  if (payload.otp !== String(code).trim()) {
    return json({ error: 'Incorrect code' }, 401);
  }

  const sessionToken = await signSessionToken(payload.email);

  // Write cookies via explicit Set-Cookie headers — the most reliable path
  // in Next.js Route Handlers where cookies().set() may not flush to the response.
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    `session=${sessionToken}; HttpOnly${secureStr}; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}; Path=/`,
  );
  headers.append(
    'Set-Cookie',
    `otp_token=; HttpOnly${secureStr}; SameSite=Lax; Max-Age=0; Path=/`,
  );

  return new Response(JSON.stringify({ ok: true, email: payload.email }), {
    status: 200,
    headers,
  });
}
