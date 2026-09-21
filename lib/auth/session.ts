import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NewApiAuthBundle, NewApiUser } from '@/lib/new-api/types';

export const SESSION_COOKIE = 'jev_session';
export const REFRESH_COOKIE = 'jev_refresh';

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function authKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 bytes');
  }
  return new TextEncoder().encode(secret);
}

export function sessionCookieSecure() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL must be configured');
  }

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('BASE_URL must be an absolute URL');
  }

  return url.protocol === 'https:';
}

export type SessionData = {
  accessToken: string;
  accessExpiresAt: number;
  sid: string;
  expires: string;
  user: NewApiUser;
};

export function sessionFromBundle(bundle: NewApiAuthBundle): SessionData {
  const expiresAt = bundle.session.expires_at
    ? new Date(bundle.session.expires_at * 1000)
    : new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  return {
    accessToken: bundle.accessToken,
    accessExpiresAt: bundle.accessExpiresAt,
    sid: bundle.session.sid,
    expires: expiresAt.toISOString(),
    user: bundle.user,
  };
}

export async function signToken(payload: SessionData) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(authKey());
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, authKey(), {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionData;
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
  const secure = sessionCookieSecure();

  store.set(SESSION_COOKIE, await signToken(session), {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires,
  });

  store.set(REFRESH_COOKIE, bundle.refreshToken, {
    httpOnly: true,
    secure,
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
