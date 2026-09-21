'use client';

import { usePathname } from 'next/navigation';
import {
  defaultLocale,
  getLocaleFromPathname,
  type Locale,
} from '@/lib/i18n/config';
import { translate, type MessageKey } from '@/lib/i18n/messages';

export function useI18n() {
  const pathname = usePathname();
  const locale: Locale =
    getLocaleFromPathname(pathname || '') || defaultLocale;

  return {
    locale,
    t: (key: MessageKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}
