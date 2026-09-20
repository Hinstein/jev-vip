'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Menu,
  TicketCheck,
  WalletCards,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/credits', icon: WalletCards, label: 'Credits' },
    { href: '/dashboard/api-keys', icon: KeyRound, label: 'API Keys' },
    { href: '/dashboard/usage', icon: Activity, label: 'Usage' },
    { href: '/dashboard/top-up', icon: CreditCard, label: 'Top up' },
    { href: '/redeem', icon: TicketCheck, label: 'Redeem code' },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-65px)] w-full max-w-7xl flex-col">
      <div className="flex items-center justify-between border-b bg-white p-4 lg:hidden">
        <span className="font-medium">Jev dashboard</span>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`absolute inset-y-0 left-0 z-40 w-64 transform border-r bg-[#f7f7f4] transition-transform duration-200 lg:relative lg:block lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              Account
            </p>
            {navItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className="my-1 w-full justify-start shadow-none"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
