import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NewApiAuthBundle, NewApiUser } from '@/lib/new-api/types';

export const SESSION_COOKIE = 'jev_session';
export const REFRESH_COOKIE = 'jev_refresh';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type SessionData = {
  user: NewApiUser;
  accessToken: string;
  accessExpiresAt: number;
  sid: string;
  expires: string;
};

export function sessionFromBundle(bundle: NewApiAuthBundle): SessionData {
  const expiresAt = bundle.session.expires_at
    ? new Date(bundle.session.expires_at * 1000)
    : new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  return {
    user: bundle.user,
    accessToken: bundle.accessToken,
    accessExpiresAt: bundle.accessExpiresAt,
    sid: bundle.session.sid,
    expires: expiresAt.toISOString(),
  };
}

export async function signToken(payload: SessionData) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(key);
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionData;
}

function secureCookie() {
  return (process.env.BASE_URL || '').startsWith('https://');
}

export async function getSession() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const session = await verifyToken(value);
    if (new Date(session.expires).getTime() <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function setSession(bundle: NewApiAuthBundle) {
  const store = await cookies();
  const session = sessionFromBundle(bundle);
  const expires = new Date(session.expires);

  store.set(SESSION_COOKIE, await signToken(session), {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'lax',
    path: '/',
    expires,
  });

  store.set(REFRESH_COOKIE, bundle.refreshToken, {
    httpOnly: true,
    secure: secureCookie(),
    sameSite: 'strict',
    path: '/',
    expires,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(REFRESH_COOKIE);
}
