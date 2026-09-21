'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Menu,
  WalletCards,
} from 'lucide-react';
import { LocaleLink } from '@/components/i18n/locale-link';
import { useI18n } from '@/components/i18n/use-i18n';
import { stripLocalePrefix } from '@/lib/i18n/config';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useI18n();
  const internalPathname = stripLocalePrefix(pathname || '/');

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.overview') },
    { href: '/dashboard/credits', icon: WalletCards, label: t('nav.credits') },
    { href: '/dashboard/api-keys', icon: KeyRound, label: t('nav.apiKeys') },
    { href: '/dashboard/usage', icon: Activity, label: t('nav.usage') },
    { href: '/dashboard/top-up', icon: CreditCard, label: t('nav.buyCredits') },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-65px)] w-full max-w-[1440px] flex-col">
      <div className="flex items-center justify-between border-b bg-white p-4 lg:hidden">
        <span className="font-medium">JEV Store</span>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">{t('nav.toggleSidebar')}</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`absolute inset-y-0 left-0 z-40 w-72 transform border-r bg-[#f7f7f4] transition-transform duration-200 lg:relative lg:block lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-5">
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              {t('dashboard.account')}
            </p>
            {navItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? internalPathname === '/dashboard'
                  : internalPathname.startsWith(item.href);

              return (
                <LocaleLink key={item.href} href={item.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className="my-1 w-full justify-start rounded-xl shadow-none"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </LocaleLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
