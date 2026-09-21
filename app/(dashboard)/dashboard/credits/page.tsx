import { redirect } from 'next/navigation';
import { WalletCards } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/new-api/user';
import { formatUsdFromQuota } from '@/lib/jev/billing';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function CreditsPage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  if (!user) redirect(localizedPath(locale, '/sign-in'));

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-gray-500">{t('credits.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {t('credits.title')}
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <WalletCards className="h-5 w-5 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">{t('credits.available')}</p>
              <p className="mt-1 text-3xl font-semibold">
                {formatUsdFromQuota(user.quota)}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">{t('credits.used')}</p>
              <p className="mt-4 text-3xl font-semibold">
                {formatUsdFromQuota(user.used_quota)}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">{t('credits.requests')}</p>
              <p className="mt-4 text-3xl font-semibold">
                {new Intl.NumberFormat('en-US').format(user.request_count)}
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          {t('credits.billedDescription')}
        </p>
      </div>
    </section>
  );
}
