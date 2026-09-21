'use client';

import { usePathname } from 'next/navigation';
import {
  getLocaleFromPathname,
  defaultLocale,
  type Locale,
} from '@/lib/i18n/config';
import { translate, type MessageKey } from '@/lib/i18n/messages';
import { useProvidedLocale } from './locale-provider';

export function useI18n() {
  const pathname = usePathname();
  const providedLocale = useProvidedLocale();
  const locale: Locale =
    getLocaleFromPathname(pathname || '') || providedLocale || defaultLocale;

  return {
    locale,
    t: (key: MessageKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}
