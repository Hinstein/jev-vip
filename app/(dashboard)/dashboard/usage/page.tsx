import { Activity } from 'lucide-react';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import {
  getRecentUsageEvents,
  getUsageSummary,
} from '@/lib/usage/queries';

export const dynamic = 'force-dynamic';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function UsagePage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const [summary, events] = await Promise.all([
    getUsageSummary(user.id),
    getRecentUsageEvents(user.id),
  ]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Metering</p>
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Requests" value={formatNumber(summary.requests)} />
        <Metric label="Total tokens" value={formatNumber(summary.totalTokens)} />
        <Metric
          label="Credits debited"
          value={formatNumber(summary.credits)}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent usage</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
              <Activity className="h-8 w-8 text-gray-400" />
              <p className="mt-4 font-medium">No usage recorded</p>
              <p className="mt-1 text-sm text-gray-500">
                Successful JEV API requests will appear here after the relay is
                configured.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Time</th>
                    <th className="py-3 pr-4 font-medium">Model</th>
                    <th className="py-3 pr-4 text-right font-medium">
                      Input
                    </th>
                    <th className="py-3 pr-4 text-right font-medium">
                      Output
                    </th>
                    <th className="py-3 text-right font-medium">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-500">
                        {event.createdAt.toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">{event.model}</td>
                      <td className="py-3 pr-4 text-right">
                        {formatNumber(event.inputTokens)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {formatNumber(event.outputTokens)}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatNumber(event.credits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
