import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  KeyRound,
  WalletCards,
  Zap,
} from 'lucide-react';
import { productConfig } from '@/lib/jev/config';

export default function HomePage() {
  return (
    <main>
      <section className="border-b bg-[#f7f7f4]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-gray-500">
              Hosted Jev API · prepaid access
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-6xl">
              Jev access without a complicated billing stack.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Create an account, add prepaid credits, generate an API key and
              call the Jev Decision API. Balance, usage and permissions are
              managed in one backend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">View credit packs</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs leading-5 text-gray-500">
              {productConfig.officialDisclaimer}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            {
              icon: WalletCards,
              title: 'Prepaid credits',
              text: 'Top up with a recharge code and use a visible account balance.',
            },
            {
              icon: KeyRound,
              title: 'API keys',
              text: 'Create and revoke keys from the dashboard without exposing the upstream Jev credential.',
            },
            {
              icon: Zap,
              title: 'Usage metering',
              text: 'Requests and credit consumption are metered by New API on every call.',
            },
          ].map((item) => (
            <div key={item.title} className="border-t pt-6">
              <item.icon className="h-5 w-5 text-gray-900" />
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-[#f7f7f4] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-gray-500">Simple flow</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Buy credits. Create a key. Call Jev.
              </h2>
            </div>
            <div className="space-y-4">
              {[
                'Sign in with a New API-backed account.',
                'Redeem a one-time recharge code.',
                'Generate an API key in the dashboard.',
                'Send Bearer-authenticated requests to /api/v1/decide.',
              ].map((text) => (
                <div key={text} className="flex gap-3 text-sm text-gray-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-950" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
