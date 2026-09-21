import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Check,
  KeyRound,
  WalletCards,
  Zap,
} from 'lucide-react';
import { productConfig } from '@/lib/jev/config';
import { getI18n } from '@/lib/i18n/server';
import { LocaleLink } from '@/components/i18n/locale-link';

export default async function HomePage() {
  const { t } = await getI18n();

  return (
    <main>
      <section className="border-b bg-[#f7f7f4]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-gray-500">
              {t('home.badge')}
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.045em] text-gray-950 sm:text-6xl">
              {t('home.titleLine1')}
            </h1>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-gray-500 sm:text-3xl">
              {t('home.titleLine2')}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              {t('home.description')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <LocaleLink href="/sign-up">
                  {t('home.createAccount')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </LocaleLink>
              </Button>
              <Button asChild size="lg" variant="outline">
                <LocaleLink href="/pricing">{t('home.viewCreditPacks')}</LocaleLink>
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
              title: t('home.prepaidCredits'),
              text: t('home.prepaidCreditsDescription'),
            },
            {
              icon: KeyRound,
              title: t('home.apiKeyWorkspace'),
              text: t('home.apiKeyWorkspaceDescription'),
            },
            {
              icon: Zap,
              title: t('home.usageVisibility'),
              text: t('home.usageVisibilityDescription'),
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
              <p className="text-sm font-medium text-gray-500">{t('home.simpleFlow')}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {t('home.flowTitle')}
              </h2>
            </div>
            <div className="space-y-4">
              {[
                t('home.step1'),
                t('home.step2'),
                t('home.step3'),
                t('home.step4'),
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
