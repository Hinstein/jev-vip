import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  KeyRound,
  MousePointerClick,
  TextCursorInput,
  WalletCards
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import {
  getNewApiSelf,
  isNewApiConfigured,
  listNewApiTokens
} from '@/lib/new-api/client';

export const dynamic = 'force-dynamic';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  let quota = 0;
  let usedQuota = 0;
  let requests = 0;
  let activeKeys = 0;

  if (isNewApiConfigured()) {
    try {
      const [backend, tokens] = await Promise.all([
        getNewApiSelf(user),
        listNewApiTokens(user),
      ]);
      quota = backend.quota;
      usedQuota = backend.used_quota;
      requests = backend.request_count;
      activeKeys = tokens.filter((token) => token.status === 1).length;
    } catch (error) {
      console.error('Unable to load New API dashboard', error);
    }
  }

  const metrics = [
    { label: 'Available quota', value: formatNumber(quota), icon: WalletCards },
    { label: 'Requests', value: formatNumber(requests), icon: MousePointerClick },
    { label: 'Used quota', value: formatNumber(usedQuota), icon: TextCursorInput },
    { label: 'Active API keys', value: activeKeys.toString(), icon: KeyRound },
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How ZEV works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ['1', 'Buy a redemption code', 'Use the sales channel listed by ZEV.'],
            ['2', 'Redeem in ZEV', 'New API validates the code and adds quota to your backend account.'],
            ['3', 'Create an API key', 'New API issues and controls the key.'],
            ['4', 'Call ZEV', 'New API authenticates, meters and routes each request.'],
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
    </section>
  );
}
