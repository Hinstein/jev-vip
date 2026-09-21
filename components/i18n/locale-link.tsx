'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import {
  defaultLocale,
  getLocaleFromPathname,
  localizedPath,
  type Locale,
} from '@/lib/i18n/config';
import { useProvidedLocale } from './locale-provider';

type LocaleLinkProps = Omit<LinkProps, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string;
    children: ReactNode;
  };

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const pathname = usePathname();
  const providedLocale = useProvidedLocale();
  const locale =
    getLocaleFromPathname(pathname || '') || providedLocale || defaultLocale;

  return <Link href={localizedPath(locale, href)} {...props} />;
}
