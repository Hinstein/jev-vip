'use client';

import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import type { NewApiUser } from '@/lib/new-api/types';
import useSWR, { mutate } from 'swr';
import { LocaleLink } from '@/components/i18n/locale-link';
import { LocaleSwitcher } from '@/components/i18n/locale-switcher';
import { useI18n } from '@/components/i18n/use-i18n';
import { localizedPath } from '@/lib/i18n/config';

const fetcher = (url: string) =>
  fetch(url).then(async (res) => (res.ok ? res.json() : null));

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<NewApiUser | null>('/api/user', fetcher);
  const router = useRouter();
  const { locale, t } = useI18n();

  async function handleSignOut() {
    await signOut();
    await mutate('/api/user', null, false);
    router.push(localizedPath(locale, '/'));
    router.refresh();
  }

  if (!user) {
    return (
      <>
        <LocaleLink
          href="/pricing"
          className="text-sm font-medium text-gray-600 hover:text-gray-950"
        >
          {t('nav.credits')}
        </LocaleLink>
        <Button asChild size="sm">
          <LocaleLink href="/sign-in">{t('login.signIn')}</LocaleLink>
        </Button>
      </>
    );
  }

  const label = user.display_name || user.username || 'U';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="size-9 cursor-pointer">
          <AvatarFallback>{label.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-gray-500">{user.group}</p>
        </div>
        <DropdownMenuItem asChild>
          <LocaleLink href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            {t('nav.dashboard')}
          </LocaleLink>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('nav.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  const { t } = useI18n();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <LocaleLink href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tracking-[-0.04em] text-gray-950">
            JEV Store
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-gray-400 sm:inline">
            prepaid API
          </span>
        </LocaleLink>

        <div className="flex items-center gap-4">
          <LocaleLink
            href="/pricing"
            className="hidden text-sm font-medium text-gray-600 hover:text-gray-950 sm:inline"
          >
            {t('nav.credits')}
          </LocaleLink>
          <Suspense fallback={<span className="h-5 w-16" />}>
            <LocaleSwitcher />
          </Suspense>
          <Suspense fallback={<div className="h-9 w-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-screen flex-col bg-white">
      <Header />
      {children}
    </section>
  );
}
