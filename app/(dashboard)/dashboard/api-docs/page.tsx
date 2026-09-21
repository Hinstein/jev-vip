import { redirect } from 'next/navigation';
import { ApiDocs } from '@/components/api-docs/api-docs';
import { getUser } from '@/lib/new-api/user';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

function publicBaseUrl() {
  const configured = process.env.BASE_URL?.trim();

  try {
    return new URL(configured || 'https://jevhub.store').origin;
  } catch {
    return 'https://jevhub.store';
  }
}

export default async function ApiDocsPage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  if (!user) redirect(localizedPath(locale, '/sign-in'));

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-gray-500">{t('apiDocs.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-950">
          {t('apiDocs.title')}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
          {t('apiDocs.description')}
        </p>

        <div className="mt-8">
          <ApiDocs baseUrl={publicBaseUrl()} />
        </div>
      </div>
    </section>
  );
}
