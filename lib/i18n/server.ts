import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from './config';
import { translate, type MessageKey } from './messages';

export async function getLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const requestLocale = requestHeaders.get('x-locale');
  if (isLocale(requestLocale)) return requestLocale;

  const cookieLocale = (await cookies()).get(localeCookieName)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export async function getI18n() {
  const locale = await getLocale();

  return {
    locale,
    t: (key: MessageKey, values?: Record<string, string | number>) =>
      translate(locale, key, values),
  };
}
