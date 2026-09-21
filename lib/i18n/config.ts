export const locales = ['en', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const localeCookieName = 'jev-locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const firstSegment = pathname.split('/')[1];
  return isLocale(firstSegment) ? firstSegment : null;
}

export function stripLocalePrefix(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname || '/';

  const stripped = pathname.slice(`/${locale}`.length);
  return stripped || '/';
}

function splitPath(path: string) {
  const match = path.match(/^([^?#]*)([?#].*)?$/);
  return {
    pathname: match?.[1] || '/',
    suffix: match?.[2] || '',
  };
}

export function localizedPath(locale: Locale, path: string): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;

  const { pathname, suffix } = splitPath(path);
  if (pathname === '/api' || pathname.startsWith('/api/')) return path;
  if (getLocaleFromPathname(pathname)) return path;

  const normalizedPath = pathname === '/' ? '' : pathname;
  return `/${locale}${normalizedPath}${suffix}`;
}

export function localeFromAcceptLanguage(
  acceptLanguage: string | null | undefined
): Locale {
  return acceptLanguage?.toLowerCase().includes('zh') ? 'zh-CN' : defaultLocale;
}
