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

type LocaleLinkProps = Omit<LinkProps, 'href'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string;
    children: ReactNode;
  };

function getLocaleForPathname(pathname: string | null): Locale {
  return getLocaleFromPathname(pathname || '') || defaultLocale;
}

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
  const pathname = usePathname();
  const locale = getLocaleForPathname(pathname);

  return <Link href={localizedPath(locale, href)} {...props} />;
}
