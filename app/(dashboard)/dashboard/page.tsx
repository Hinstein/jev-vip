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
import { getCreditBalance } from '@/lib/credits/queries';
import { getActiveApiKeyCount } from '@/lib/api-keys/queries';
import { getUsageSummary } from '@/lib/usage/queries';
import { isLiteLLMConfigured } from '@/lib/litellm/client';

export const dynamic = 'force-dynamic';

function formatCredits(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const [balance, usage, activeKeys] = await Promise.all([
    getCreditBalance(user.id),
    getUsageSummary(user.id),
    getActiveApiKeyCount(user.id),
  ]);
  const offerkitConfigured = Boolean(
    process.env.OFFERKIT_API_URL && process.env.OFFERKIT_API_KEY
  );

  const metrics = [
    {
      label: 'JEV Credits',
      value: formatCredits(balance),
      icon: WalletCards
    },
    {
      label: 'Requests',
      value: usage.requests.toLocaleString(),
      icon: MousePointerClick
    },
    {
      label: 'Input tokens',
      value: usage.inputTokens.toLocaleString(),
      icon: TextCursorInput
    },
    {
      label: 'Active API keys',
      value: activeKeys.toString(),
      icon: KeyRound
    }
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
            <CardTitle>How credits work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ['1', 'Buy on Xianyu', 'Xianyu is only the sales channel.'],
              ['2', 'Receive a unique code', 'OfferKit owns voucher validity and one-time redemption.'],
              ['3', 'Redeem on JEV Store', 'The matching product credits are added to your account.'],
              ['4', 'Use JEV', 'Successful API requests debit the same JEV credit ledger by token usage.']
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
            <CardTitle>Integration status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <StatusRow label="SaaS authentication" status="Ready" />
            <StatusRow label="JEV credit ledger" status="Ready" />
            <StatusRow
              label="OfferKit voucher adapter"
              status={offerkitConfigured ? 'Configured' : 'Needs env'}
            />
            <StatusRow
              label="JEV API relay"
              status={isLiteLLMConfigured() ? 'Configured' : 'Needs env'}
            />
            <StatusRow label="Usage metering / debit" status="Ready" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const ready = status === 'Ready' || status === 'Configured';

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-1 text-xs ${
          ready ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {status}
      </span>
    </div>
  );
}
