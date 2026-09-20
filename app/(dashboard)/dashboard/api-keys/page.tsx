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
      keys = await listNewApiTokens(user);
    } catch (error) {
      console.error('Unable to load New API keys', error);
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div>
        <p className="text-sm text-gray-500">Access</p>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Create and revoke ZEV API keys. Keys, quota, usage and access control
          are managed by the New API backend.
        </p>
      </div>

      <div className="mt-6">
        <KeyManager initialKeys={keys} configured={configured} />
      </div>
    </section>
  );
}
