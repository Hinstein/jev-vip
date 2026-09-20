import Link from 'next/link';
import {
  ArrowRight,
  CircleDollarSign,
  KeyRound,
  MousePointerClick,
  TextCursorInput
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { dashboardPlaceholderMetrics } from '@/lib/jev/config';

const metrics = [
  {
    label: 'Credit balance',
    value: `$${dashboardPlaceholderMetrics.balanceUsd.toFixed(2)}`,
    icon: CircleDollarSign
  },
  {
    label: 'Requests',
    value: dashboardPlaceholderMetrics.requests.toLocaleString(),
    icon: MousePointerClick
  },
  {
    label: 'Input tokens',
    value: dashboardPlaceholderMetrics.inputTokens.toLocaleString(),
    icon: TextCursorInput
  },
  {
    label: 'Active API keys',
    value: dashboardPlaceholderMetrics.activeKeys.toString(),
    icon: KeyRound
  }
];

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Customer dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard/top-up">
            Top up credits
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
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ['1', 'Create your account', 'Completed by signing in to this dashboard.'],
              ['2', 'Top up credits', 'Payment flow will be connected in phase 2.'],
              ['3', 'Create an API key', 'Key issuance will unlock after credit delivery is wired.'],
              ['4', 'Track usage', 'Requests and token usage will appear automatically.']
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
            <StatusRow label="Customer dashboard" status="Ready" />
            <StatusRow label="Credit purchase" status="Phase 2" />
            <StatusRow label="Jev delivery / proxy" status="Phase 2" />
            <StatusRow label="Usage metering" status="Phase 2" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const ready = status === 'Ready';

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
