'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import {
  defaultLocale,
  getLocaleFromPathname,
  localizedPath,
  type Locale,
} from '@/lib/i18n/config';
import { useI18n } from './use-i18n';

function replaceLocale(pathname: string, locale: Locale) {
  const currentLocale = getLocaleFromPathname(pathname);
  if (!currentLocale) return localizedPath(locale, pathname || '/');

  const rest = pathname.slice(`/${currentLocale}`.length) || '/';
  return localizedPath(locale, rest);
}

export function LocaleSwitcher() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
  const nextLocale: Locale = locale === 'zh-CN' ? defaultLocale : 'zh-CN';
  const query = searchParams.toString();
  const targetPath = replaceLocale(pathname, nextLocale);
  const target = query ? `${targetPath}?${query}` : targetPath;

  return (
    <Link
      href={target}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 hover:text-gray-950"
      aria-label={`${t('common.language')}: ${t(
        nextLocale === 'zh-CN' ? 'common.chinese' : 'common.english'
      )}`}
    >
      <Globe2 aria-hidden="true" className="h-4 w-4" />
      {nextLocale === 'zh-CN' ? t('common.chinese') : t('common.english')}
    </Link>
  );
}
