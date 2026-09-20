import { creditPacks } from '@/lib/jev/config';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function TopUpPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Credits</p>
      <h1 className="text-2xl font-semibold tracking-tight">Top Up</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-500">
        The customer-facing credit pack UI is in place. Payment collection,
        order confirmation and automatic Jev delivery are intentionally deferred
        to phase 2.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {creditPacks.map((pack) => (
          <Card key={pack.amount} className={pack.popular ? 'ring-2 ring-gray-950' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{pack.label}</CardTitle>
                {pack.popular ? (
                  <span className="rounded-full bg-gray-950 px-2 py-1 text-xs text-white">
                    Popular
                  </span>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">${pack.amount}</p>
              <p className="mt-2 text-sm text-gray-500">
                Prepaid balance. Final exchange rate and delivery rules will be
                configured before launch.
              </p>
              <Button className="mt-5 w-full" disabled>
                Payment coming in phase 2
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
