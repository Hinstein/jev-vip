import { redirect } from 'next/navigation';
import { BadgeCheck, WalletCards } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/new-api/user';
import { RedeemForm } from './redeem-form';
import { formatUsdFromQuota } from '@/lib/jev/billing';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function RedeemPage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  if (!user) {
    redirect(
      localizedPath(
        locale,
        `/sign-in?redirect=${encodeURIComponent(localizedPath(locale, '/redeem'))}`
      )
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="border-b pb-7">
        <p className="text-sm font-medium text-gray-500">{t('redeem.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {t('redeem.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          {t('redeem.description')}
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_260px]">
        <Card className="shadow-none">
          <CardContent className="p-6">
            <RedeemForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <WalletCards className="h-5 w-5 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">{t('redeem.availableBalance')}</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatUsdFromQuota(user.quota)}
              </p>
            </CardContent>
          </Card>

          <div className="rounded-xl border bg-white p-4 text-sm leading-6 text-gray-500">
            <div className="flex gap-2">
              <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-gray-900" />
              <p>
                {t('redeem.voucherNote')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
