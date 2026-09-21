import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  REFRESH_COOKIE,
  SESSION_COOKIE,
  sessionCookieSecure,
  sessionFromBundle,
  signToken,
  verifyToken,
} from '@/lib/auth/session';
import { forwardedForFromHeaders } from '@/lib/http/client-ip';
import { refreshNewApiAuth } from '@/lib/new-api/auth';
import {
  getLocaleFromPathname,
  isLocale,
  localeCookieName,
  localeFromAcceptLanguage,
  localizedPath,
  stripLocalePrefix,
  type Locale,
} from '@/lib/i18n/config';

const protectedRoutes = ['/dashboard', '/redeem'];
const protectedApiRoutes = ['/api/keys', '/api/redeem', '/api/user'];
const internalLocaleRewriteHeader = 'x-jev-locale-rewrite';

function preferredLocale(request: NextRequest): Locale {
  // Next may run middleware again after a locale-prefixed page is rewritten
  // to its internal route. Preserve the locale carried on that rewrite so a
  // direct /zh-CN/... request is not redirected back to /en/....
  const rewriteLocale = request.headers.get(internalLocaleRewriteHeader);
  if (isLocale(rewriteLocale)) return rewriteLocale;

  const requestLocale = request.headers.get('x-locale');
  if (isLocale(requestLocale)) return requestLocale;

  const cookieLocale = request.cookies.get(localeCookieName)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return localeFromAcceptLanguage(request.headers.get('accept-language'));
}

function isPageRequest(pathname: string) {
  return !pathname.startsWith('/api/') && !pathname.includes('.');
}

function isApiPath(pathname: string) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function isProtectedPath(pathname: string) {
  return (
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    protectedApiRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  );
}

function signInUrl(
  request: NextRequest,
  locale: Locale,
  redirectPath: string
) {
  const configuredBaseUrl = process.env.BASE_URL?.trim();
  const url = configuredBaseUrl
    ? new URL(localizedPath(locale, '/sign-in'), configuredBaseUrl)
    : new URL(localizedPath(locale, '/sign-in'), request.url);
  url.searchParams.set('redirect', redirectPath);
  return url;
}

function publicUrl(
  request: NextRequest,
  pathname: string,
  search = ''
) {
  const configuredBaseUrl = process.env.BASE_URL?.trim();
  return new URL(`${pathname}${search}`, configuredBaseUrl || request.url);
}

function internalRewriteUrl(
  request: NextRequest,
  pathname: string,
  search = ''
) {
  const configuredInternalBaseUrl = process.env.INTERNAL_BASE_URL?.trim();
  const url = new URL(
    `${pathname}${search}`,
    configuredInternalBaseUrl || request.url
  );

  // The Next server listens over plain HTTP behind Caddy. When the proxy's
  // forwarded scheme is HTTPS, keep the internal rewrite from attempting TLS
  // against the loopback Next listener.
  if (!configuredInternalBaseUrl) url.protocol = 'http:';

  return url;
}

function unauthorized(
  request: NextRequest,
  locale: Locale,
  redirectPath: string
) {
  if (isApiPath(request.nextUrl.pathname)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.redirect(signInUrl(request, locale, redirectPath));
}

function clearAuth(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(localeCookieName, locale, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}

function localizedResponse(
  request: NextRequest,
  locale: Locale,
  localeFromPath: Locale | null,
  internalPathname: string,
  search: string,
  requestHeaders: Headers
) {
  if (localeFromPath && !isApiPath(internalPathname)) {
    requestHeaders.set(internalLocaleRewriteHeader, locale);
  }

  const response =
    localeFromPath && !isApiPath(internalPathname)
      ? NextResponse.rewrite(
          internalRewriteUrl(request, internalPathname, search),
          { request: { headers: requestHeaders } }
        )
      : NextResponse.next({ request: { headers: requestHeaders } });

  return localeFromPath ? setLocaleCookie(response, locale) : response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const localeFromPath = getLocaleFromPathname(pathname);
  const locale = localeFromPath || preferredLocale(request);
  const internalPathname = localeFromPath
    ? stripLocalePrefix(pathname)
    : pathname;
  const protectedPath = isProtectedPath(internalPathname);
  const redirectPath = `${pathname}${search}`;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  // The locale-prefixed URL is rewritten to the existing route tree. Bootstrap
  // the locale cookie once so server components can still recover the locale
  // after Next performs that internal rewrite.
  const localeCookie = request.cookies.get(localeCookieName)?.value;
  if (
    localeFromPath &&
    !isApiPath(internalPathname) &&
    localeCookie !== locale
  ) {
    const response = NextResponse.redirect(
      publicUrl(request, pathname, search)
    );
    return setLocaleCookie(response, locale);
  }

  const isInternalLocaleRewrite =
    request.headers.has(internalLocaleRewriteHeader);

  if (!localeFromPath && isPageRequest(pathname) && !isInternalLocaleRewrite) {
    const url = publicUrl(request, localizedPath(locale, pathname), search);
    const response = NextResponse.redirect(url);
    return setLocaleCookie(response, locale);
  }

  if (protectedPath && !sessionCookie) {
    return unauthorized(request, locale, redirectPath);
  }

  if (!protectedPath) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);
    return localizedResponse(
      request,
      locale,
      localeFromPath,
      internalPathname,
      search,
      requestHeaders
    );
  }

  let session;
  try {
    session = await verifyToken(sessionCookie as string);
  } catch {
    return clearAuth(unauthorized(request, locale, redirectPath));
  }

  if (new Date(session.expires).getTime() <= Date.now()) {
    return clearAuth(unauthorized(request, locale, redirectPath));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);

  const now = Math.floor(Date.now() / 1000);
  if (session.accessExpiresAt > now + 60) {
    return localizedResponse(
      request,
      locale,
      localeFromPath,
      internalPathname,
      search,
      requestHeaders
    );
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return clearAuth(unauthorized(request, locale, redirectPath));
  }

  try {
    const bundle = await refreshNewApiAuth(refreshToken, session.sid, {
      forwardedFor: forwardedForFromHeaders(request.headers),
      userAgent: request.headers.get('user-agent'),
    });
    const nextSession = sessionFromBundle(bundle);
    const response = localizedResponse(
      request,
      locale,
      localeFromPath,
      internalPathname,
      search,
      requestHeaders
    );
    const secure = sessionCookieSecure();
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
    return clearAuth(unauthorized(request, locale, redirectPath));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
