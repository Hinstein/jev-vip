import { redirect } from 'next/navigation';
import {
  isNewApiConfigured,
  listNewApiTokens,
  type NewApiToken,
} from '@/lib/new-api/client';
import { getUser } from '@/lib/db/queries';
import { KeyManager } from './key-manager';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

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
        <p className="text-sm font-medium text-gray-500">Access</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">API Keys</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
          Create a key for your Jev API calls and revoke it whenever you need
          to rotate access.
        </p>

        <div className="mt-8">
          <KeyManager initialKeys={keys} configured={configured} />
        </div>
      </div>
    </section>
  );
}
