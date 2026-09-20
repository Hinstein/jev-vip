import { Activity } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function UsagePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Metering</p>
      <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric label="Requests" value="0" />
        <Metric label="Input tokens" value="0" />
        <Metric label="Spend" value="$0.00" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
            <Activity className="h-8 w-8 text-gray-400" />
            <p className="mt-4 font-medium">No usage recorded</p>
            <p className="mt-1 text-sm text-gray-500">
              Per-request usage events will appear here after the Jev proxy and
              metering layer are connected.
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
