import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { NewApiAuthBundle } from '@/lib/new-api/types';

// These cookies contain credentials issued by New API. JEV does not sign,
// decode, persist or otherwise reinterpret them as a second session system.
export const NEW_API_ACCESS_COOKIE = 'new_api_access';
export const NEW_API_REFRESH_COOKIE = 'new_api_refresh';
export const NEW_API_SESSION_COOKIE = 'new_api_session';

export type NewApiCredentials = {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
};

function expiryFromUnixSeconds(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value <= 0) return undefined;
  return new Date(value * 1000);
}

function sessionExpiry(bundle: NewApiAuthBundle) {
  return expiryFromUnixSeconds(bundle.session.expires_at);
}

export function authCookieSecure() {
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) throw new Error('BASE_URL must be configured');

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('BASE_URL must be an absolute URL');
  }

  return url.protocol === 'https:';
}

function authCookieOptions(
  sameSite: 'lax' | 'strict',
  expires?: Date
) {
  return {
    httpOnly: true,
    secure: authCookieSecure(),
    sameSite,
    path: '/',
    ...(expires ? { expires } : {}),
  } as const;
}

function writeAuthCookies(
  response: NextResponse,
  bundle: NewApiAuthBundle
) {
  const accessExpires = expiryFromUnixSeconds(bundle.accessExpiresAt);
  const refreshExpires = sessionExpiry(bundle);

  response.cookies.set(
    NEW_API_ACCESS_COOKIE,
    bundle.accessToken,
    authCookieOptions('lax', accessExpires)
  );
  response.cookies.set(
    NEW_API_REFRESH_COOKIE,
    bundle.refreshToken,
    authCookieOptions('strict', refreshExpires)
  );
  response.cookies.set(
    NEW_API_SESSION_COOKIE,
    bundle.session.sid,
    authCookieOptions('strict', refreshExpires)
  );
  return response;
}

export function setNewApiAuthCookies(
  response: NextResponse,
  bundle: NewApiAuthBundle
) {
  return writeAuthCookies(response, bundle);
}

export async function storeNewApiAuthCookies(bundle: NewApiAuthBundle) {
  const store = await cookies();
  const accessExpires = expiryFromUnixSeconds(bundle.accessExpiresAt);
  const refreshExpires = sessionExpiry(bundle);

  store.set(
    NEW_API_ACCESS_COOKIE,
    bundle.accessToken,
    authCookieOptions('lax', accessExpires)
  );
  store.set(
    NEW_API_REFRESH_COOKIE,
    bundle.refreshToken,
    authCookieOptions('strict', refreshExpires)
  );
  store.set(
    NEW_API_SESSION_COOKIE,
    bundle.session.sid,
    authCookieOptions('strict', refreshExpires)
  );
}

export function clearNewApiAuthCookies(response: NextResponse) {
  response.cookies.delete(NEW_API_ACCESS_COOKIE);
  response.cookies.delete(NEW_API_REFRESH_COOKIE);
  response.cookies.delete(NEW_API_SESSION_COOKIE);
  return response;
}

export async function clearStoredNewApiAuthCookies() {
  const store = await cookies();
  store.delete(NEW_API_ACCESS_COOKIE);
  store.delete(NEW_API_REFRESH_COOKIE);
  store.delete(NEW_API_SESSION_COOKIE);
}

export async function getNewApiCredentials(): Promise<NewApiCredentials> {
  const store = await cookies();
  return {
    accessToken: store.get(NEW_API_ACCESS_COOKIE)?.value,
    refreshToken: store.get(NEW_API_REFRESH_COOKIE)?.value,
    sessionId: store.get(NEW_API_SESSION_COOKIE)?.value,
  };
}

export async function getNewApiAccessToken() {
  const credentials = await getNewApiCredentials();
  if (!credentials.accessToken) throw new Error('User is not authenticated');
  return credentials.accessToken;
}
