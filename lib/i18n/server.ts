import { headers } from 'next/headers';
import { defaultLocale, isLocale, type Locale } from './config';
import { translate, type MessageKey } from './messages';

export async function getLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const requestLocale = requestHeaders.get('x-locale');
  return isLocale(requestLocale) ? requestLocale : defaultLocale;
}

export async function getI18n() {
  const locale = await getLocale();

  return {
    locale,
    t: (key: MessageKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}
