import { redirect } from 'next/navigation';
import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/new-api/user';
import { formatUsdFromQuota } from '@/lib/jev/billing';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export default async function UsagePage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  if (!user) redirect(localizedPath(locale, '/sign-in'));

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-gray-500">{t('usage.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('usage.title')}</h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label={t('usage.requests')} value={formatNumber(user.request_count, locale)} />
          <Metric label={t('usage.apiSpend')} value={formatUsdFromQuota(user.used_quota)} />
          <Metric label={t('usage.remaining')} value={formatUsdFromQuota(user.quota)} />
        </div>

        <Card className="mt-6 shadow-none">
          <CardContent className="flex gap-3 p-6">
            <Activity className="mt-0.5 h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium">{t('usage.autoUpdates')}</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {t('usage.autoUpdatesDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
