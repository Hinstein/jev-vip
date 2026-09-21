'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/config';

const LocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useProvidedLocale(): Locale | null {
  return useContext(LocaleContext);
}
