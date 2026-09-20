import { redirect } from 'next/navigation';
import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/new-api/user';
import { formatUsdFromQuota } from '@/lib/jev/billing';

export const dynamic = 'force-dynamic';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function UsagePage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-gray-500">Metering</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Usage</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Requests" value={formatNumber(user.request_count)} />
          <Metric label="API spend" value={formatUsdFromQuota(user.used_quota)} />
          <Metric label="Remaining" value={formatUsdFromQuota(user.quota)} />
        </div>

        <Card className="mt-6 shadow-none">
          <CardContent className="flex gap-3 p-6">
            <Activity className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">Usage updates automatically</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Each successful request is settled against the input-token count
                reported by the Jev upstream response.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
