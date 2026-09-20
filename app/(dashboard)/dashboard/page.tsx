import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  KeyRound,
  MousePointerClick,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import { listNewApiTokens } from '@/lib/new-api/client';

export const dynamic = 'force-dynamic';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  let activeKeys = 0;
  try {
    const tokens = await listNewApiTokens();
    activeKeys = tokens.filter((token) => token.status === 1).length;
  } catch (error) {
    console.error('Unable to load API keys', error);
  }

  const metrics = [
    {
      label: 'Available credits',
      value: formatNumber(user.quota),
      icon: WalletCards,
    },
    {
      label: 'Used credits',
      value: formatNumber(user.used_quota),
      icon: Zap,
    },
    {
      label: 'Requests',
      value: formatNumber(user.request_count),
      icon: MousePointerClick,
    },
    {
      label: 'Active API keys',
      value: activeKeys.toString(),
      icon: KeyRound,
    },
  ];

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Hosted Jev API</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Signed in as {user.display_name || user.username}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/redeem">Redeem code</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/top-up">
                Top up
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <metric.icon className="h-4 w-4 text-gray-400" />
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Quick start</p>
              <h2 className="mt-1 text-xl font-semibold">Call the Jev Decision API</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Create an API key, keep it server-side, then send Jev-shaped
                requests to the hosted endpoint.
              </p>
              <div className="mt-5 rounded-xl bg-gray-950 p-4 text-sm text-gray-100">
                <div className="font-mono">POST /api/v1/decide</div>
                <div className="mt-2 font-mono text-gray-400">
                  Authorization: Bearer sk-...
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild size="sm">
                  <Link href="/dashboard/api-keys">Manage API keys</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/usage">View usage</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">Account</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Username</dt>
                  <dd className="font-medium">{user.username}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Group</dt>
                  <dd className="font-medium">{user.group}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Account ID</dt>
                  <dd className="font-mono text-xs">{user.id}</dd>
                </div>
              </dl>
              <p className="mt-5 border-t pt-4 text-xs leading-5 text-gray-400">
                Account status, roles and permissions come from New API.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
