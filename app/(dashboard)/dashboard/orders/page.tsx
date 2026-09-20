import { FileClock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function OrdersPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Billing history</p>
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top-up orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
            <FileClock className="h-8 w-8 text-gray-400" />
            <p className="mt-4 font-medium">No orders yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Order ID, payment status, credited amount and delivery status will
              be shown here after the top-up workflow is implemented.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
