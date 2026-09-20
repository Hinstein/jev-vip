'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  KeyRound,
  MousePointerClick,
  WalletCards,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope, NewApiToken, PageData } from '@/lib/new-api/types';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

export default function DashboardPage() {
  const { user, authFetch } = useAuth();
  const [activeKeys, setActiveKeys] = useState(0);

  useEffect(() => {
    if (!user) return;
    void authFetch('/api/token/?p=1&page_size=100')
      .then((response) => response.json())
      .then((payload: ApiEnvelope<PageData<NewApiToken>>) => {
        const items = payload.data?.items ?? [];
        setActiveKeys(items.filter((item) => item.status === 1).length);
      })
      .catch(() => setActiveKeys(0));
  }, [user, authFetch]);

  if (!user) return null;

  const metrics = [
    { label: 'Available credits', value: formatNumber(user.quota), icon: WalletCards },
    { label: 'Used credits', value: formatNumber(user.used_quota), icon: ChartNoAxesColumnIncreasing },
    { label: 'Requests', value: formatNumber(user.request_count), icon: MousePointerClick },
    { label: 'Active API keys', value: formatNumber(activeKeys), icon: KeyRound },
  ];

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Customer dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        </div>
        <Button asChild>
          <Link href="/redeem">
            Redeem a code
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start using the API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ['1', 'Buy a credit code', 'Use the configured sales channel.'],
              ['2', 'Redeem it here', 'New API validates the code and credits your account.'],
              ['3', 'Create an API key', 'Keys, limits and usage are owned by New API.'],
              ['4', 'Call the gateway', 'Use the API base URL shown in the integration guide.'],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs font-medium text-white">
                  {step}
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend ownership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <StatusRow label="Users & sessions" />
            <StatusRow label="Wallet & redemption codes" />
            <StatusRow label="API keys & usage" />
            <StatusRow label="Models, channels & routing" />
            <StatusRow label="Admin console" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatusRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span>{label}</span>
      <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
        New API
      </span>
    </div>
  );
}
