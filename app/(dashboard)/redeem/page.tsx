import { redirect } from 'next/navigation';
import { BadgeCheck, WalletCards } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUser } from '@/lib/db/queries';
import { getCreditBalance } from '@/lib/credits/queries';
import { RedeemForm } from './redeem-form';

export const dynamic = 'force-dynamic';

function formatCredits(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function RedeemPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in?redirect=%2Fredeem');
  }

  const balance = await getCreditBalance(user.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="text-sm text-gray-500">Voucher redemption</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Redeem JEV Credits
        </h1>
        <p className="mt-3 text-gray-600">
          Buy a package from the configured sales channel, then redeem the code
          here. OfferKit only validates and consumes the code; JEV VIP owns your
          credit balance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <Card>
          <CardHeader>
            <CardTitle>Enter your code</CardTitle>
          </CardHeader>
          <CardContent>
            <RedeemForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <WalletCards className="h-5 w-5 text-gray-500" />
              <p className="mt-3 text-sm text-gray-500">Current balance</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCredits(balance)}
              </p>
              <p className="text-xs text-gray-500">JEV Credits</p>
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
            <div className="flex gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-900" />
              <p>
                A successful voucher can credit an account only once. Raw
                voucher codes are not stored in the JEV database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
