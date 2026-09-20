import { redirect } from 'next/navigation';
import { WalletCards } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import { getNewApiSelf } from '@/lib/new-api/client';

export const dynamic = 'force-dynamic';

function formatCredits(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function CreditsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  let quota = 0;
  let usedQuota = 0;
  let requestCount = 0;

  try {
    const backend = await getNewApiSelf(user);
    quota = backend.quota;
    usedQuota = backend.used_quota;
    requestCount = backend.request_count;
  } catch (error) {
    console.error('Unable to load New API wallet', error);
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <p className="text-sm text-gray-500">Wallet</p>
      <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <WalletCards className="h-5 w-5 text-gray-500" />
            <p className="mt-3 text-sm text-gray-500">Available quota</p>
            <p className="mt-1 text-3xl font-semibold">{formatCredits(quota)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Used quota</p>
            <p className="mt-3 text-3xl font-semibold">{formatCredits(usedQuota)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Requests</p>
            <p className="mt-3 text-3xl font-semibold">{formatCredits(requestCount)}</p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 max-w-2xl text-sm text-gray-500">
        Wallet quota and API consumption are sourced from New API. Redemption
        history and administrative adjustments are managed in the New API
        admin console.
      </p>
    </section>
  );
}
