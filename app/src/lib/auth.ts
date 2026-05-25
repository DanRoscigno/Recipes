import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const OTP_SECRET = new TextEncoder().encode(
  process.env.OTP_SECRET ?? 'dev-otp-secret-change-in-production'
);
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'dev-session-secret-change-in-production'
);

const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? 'roscigno.com')
  .split(',')
  .map(d => d.trim().toLowerCase());

export function isEmailAllowed(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

export async function signOtpToken(email: string, otp: string): Promise<string> {
  return new SignJWT({ email, otp })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .sign(OTP_SECRET);
}

export async function verifyOtpToken(
  token: string
): Promise<{ email: string; otp: string } | null> {
  try {
    const { payload } = await jwtVerify(token, OTP_SECRET);
    return payload as { email: string; otp: string };
  } catch {
    return null;
  }
}

export async function signSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as { email: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const token = jar.get('session')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
