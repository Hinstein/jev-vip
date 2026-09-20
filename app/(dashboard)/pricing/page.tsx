import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { creditPacks, productConfig } from '@/lib/jev/config';

export default function PricingPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-gray-500">Prepaid credits</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Choose a top-up amount
        </h1>
        <p className="mt-4 text-gray-600">
          Phase 1 exposes the product and dashboard flow only. Checkout and
          automatic credit delivery will be connected next.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {creditPacks.map((pack) => (
          <div
            key={pack.amount}
            className={`rounded-2xl border bg-white p-6 ${
              pack.popular ? 'ring-2 ring-gray-950' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{pack.label}</h2>
              {pack.popular ? (
                <span className="rounded-full bg-gray-950 px-2 py-1 text-xs text-white">
                  Popular
                </span>
              ) : null}
            </div>
            <p className="mt-5 text-4xl font-semibold">${pack.amount}</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-gray-950" />
                Prepaid balance
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-gray-950" />
                Dashboard usage visibility
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-gray-950" />
                API key management
              </li>
            </ul>
            <Button asChild className="mt-6 w-full">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-gray-500">
        {productConfig.officialDisclaimer} Pricing and delivery terms shown in
        the product will be finalized before payment is enabled.
      </p>
    </main>
  );
}
