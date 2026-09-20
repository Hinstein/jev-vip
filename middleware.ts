import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  REFRESH_COOKIE,
  SESSION_COOKIE,
  sessionFromBundle,
  signToken,
  verifyToken,
} from '@/lib/auth/session';
import { refreshNewApiAuth } from '@/lib/new-api/auth';

function unauthorized(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

function clearAuth(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return unauthorized(request);

  let session;
  try {
    session = await verifyToken(sessionCookie);
  } catch {
    return clearAuth(unauthorized(request));
  }

  if (new Date(session.expires).getTime() <= Date.now()) {
    return clearAuth(unauthorized(request));
  }

  const now = Math.floor(Date.now() / 1000);
  if (session.accessExpiresAt > now + 60) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return clearAuth(unauthorized(request));
  }

  try {
    const bundle = await refreshNewApiAuth(
      refreshToken,
      session.sid,
      request.headers.get('user-agent')
    );
    const nextSession = sessionFromBundle(bundle);
    const response = NextResponse.next();
    const secure = request.nextUrl.protocol === 'https:';
    const expires = new Date(nextSession.expires);

    response.cookies.set(SESSION_COOKIE, await signToken(nextSession), {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      expires,
    });
    response.cookies.set(REFRESH_COOKIE, bundle.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      expires,
    });

    return response;
  } catch {
    return clearAuth(unauthorized(request));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/redeem/:path*',
    '/api/keys/:path*',
    '/api/redeem/:path*',
    '/api/user',
  ],
  runtime: 'nodejs',
};
