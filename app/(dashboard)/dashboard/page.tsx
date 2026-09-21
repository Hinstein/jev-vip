import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  KeyRound,
  MousePointerClick,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUser } from '@/lib/new-api/user';
import { listNewApiTokens } from '@/lib/new-api/client';
import { formatUsdFromQuota } from '@/lib/jev/billing';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';
import { LocaleLink } from '@/components/i18n/locale-link';

export const dynamic = 'force-dynamic';

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

export default async function DashboardPage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  if (!user) redirect(localizedPath(locale, '/sign-in'));

  let activeKeys = 0;
  try {
    const tokens = await listNewApiTokens();
    activeKeys = tokens.filter((token) => token.status === 1).length;
  } catch (error) {
    console.error('Unable to load API keys', error);
  }

  const metrics = [
    {
      label: t('dashboard.availableBalance'),
      value: formatUsdFromQuota(user.quota),
      icon: WalletCards,
    },
    {
      label: t('dashboard.apiSpend'),
      value: formatUsdFromQuota(user.used_quota),
      icon: Zap,
    },
    {
      label: t('dashboard.requests'),
      value: formatNumber(user.request_count, locale),
      icon: MousePointerClick,
    },
    {
      label: t('dashboard.activeApiKeys'),
      value: activeKeys.toString(),
      icon: KeyRound,
    },
  ];

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('dashboard.eyebrow')}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
              {t('dashboard.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {t('dashboard.signedInAs', {
                value: user.email || user.display_name || user.username,
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <LocaleLink href="/redeem">{t('dashboard.redeemCode')}</LocaleLink>
            </Button>
            <Button asChild>
              <LocaleLink href="/dashboard/top-up">
                {t('dashboard.topUp')}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </LocaleLink>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <metric.icon className="h-4 w-4 text-gray-400" />
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {metric.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">{t('dashboard.quickStart')}</p>
              <h2 className="mt-1 text-xl font-semibold">
                {t('dashboard.callDecisionApi')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {t('dashboard.quickStartDescription')}
              </p>
              <div className="mt-5 rounded-xl bg-gray-950 p-4 text-sm text-gray-100">
                <div className="font-mono">POST /api/v1/decide</div>
                <div className="mt-2 font-mono text-gray-400">
                  Authorization: Bearer sk-...
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button asChild size="sm">
                  <LocaleLink href="/dashboard/api-keys">
                    {t('dashboard.manageApiKeys')}
                  </LocaleLink>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <LocaleLink href="/dashboard/usage">
                    {t('dashboard.viewUsage')}
                  </LocaleLink>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500">{t('dashboard.account')}</p>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">{t('dashboard.email')}</dt>
                  <dd className="font-medium">{user.email || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">{t('dashboard.group')}</dt>
                  <dd className="font-medium">{user.group}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">{t('dashboard.accountId')}</dt>
                  <dd className="font-mono text-xs">{user.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
