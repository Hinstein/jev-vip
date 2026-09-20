import { redirect } from 'next/navigation';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import { getNewApiSelf } from '@/lib/new-api/client';

export const dynamic = 'force-dynamic';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function UsagePage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  let requests = 0;
  let usedQuota = 0;
  let remainingQuota = 0;

  try {
    const backend = await getNewApiSelf(user);
    requests = backend.request_count;
    usedQuota = backend.used_quota;
    remainingQuota = backend.quota;
  } catch (error) {
    console.error('Unable to load New API usage', error);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Metering</p>
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Requests" value={formatNumber(requests)} />
        <Metric label="Used quota" value={formatNumber(usedQuota)} />
        <Metric label="Remaining quota" value={formatNumber(remainingQuota)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Usage source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-xl border p-4">
            <Activity className="mt-0.5 h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-500">
              Request accounting, token usage, model cost and detailed logs are
              recorded by New API. Detailed per-request investigation belongs
              in the New API admin console.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
