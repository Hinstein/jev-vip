import { redirect } from 'next/navigation';
import {
  isNewApiConfigured,
  listNewApiTokens,
  type NewApiToken,
} from '@/lib/new-api/client';
import { getUser } from '@/lib/new-api/user';
import { KeyManager } from './key-manager';
import { getI18n } from '@/lib/i18n/server';
import { localizedPath } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const { locale, t } = await getI18n();
  const user = await getUser();
  if (!user) redirect(localizedPath(locale, '/sign-in'));

  const configured = isNewApiConfigured();
  let keys: NewApiToken[] = [];

  if (configured) {
    try {
      keys = await listNewApiTokens();
    } catch (error) {
      console.error('Unable to load Jev API keys', error);
    }
  }

  return (
    <section className="flex-1 px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-gray-500">{t('apiKeys.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t('apiKeys.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          {t('apiKeys.description')}
        </p>

        <div className="mt-8">
          <KeyManager initialKeys={keys} configured={configured} />
        </div>
      </div>
    </section>
  );
}
