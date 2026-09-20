import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BadgeDollarSign,
  Gauge,
  KeyRound,
  LineChart,
  ShieldCheck
} from 'lucide-react';
import { productConfig } from '@/lib/jev/config';

const features = [
  {
    icon: BadgeDollarSign,
    title: 'Prepaid credits',
    description:
      'Top up first, then use the service from a visible balance. Real payment delivery is the next implementation phase.'
  },
  {
    icon: KeyRound,
    title: 'API key workspace',
    description:
      'One place to create, view and revoke service keys once the delivery backend is connected.'
  },
  {
    icon: LineChart,
    title: 'Usage visibility',
    description:
      'Track requests, input tokens, spend and remaining credits without digging through logs.'
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4" />
              Independent Jev access service
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-950 sm:text-6xl">
              Jev credits and API access,
              <span className="block text-gray-500">managed in one dashboard.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Start with a simple prepaid workflow: create an account, top up
              credits, receive API access, and track usage. Phase one ships the
              SaaS foundation; payment and automatic delivery are intentionally
              kept separate for the next phase.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/sign-up">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/pricing">View credit packs</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs text-gray-500">
              {productConfig.officialDisclaimer}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-gray-950">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gray-950 px-6 py-10 text-white sm:px-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Gauge className="h-4 w-4" />
                  Phase 1 foundation
                </div>
                <h2 className="mt-3 text-3xl font-semibold">
                  Account → credits → key → usage
                </h2>
                <p className="mt-3 max-w-2xl text-gray-300">
                  The product flow is fixed now so payment and Jev delivery can
                  be added later without rebuilding authentication, navigation
                  or the customer dashboard.
                </p>
              </div>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white text-gray-950 hover:bg-gray-100">
                <Link href="/sign-in">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
