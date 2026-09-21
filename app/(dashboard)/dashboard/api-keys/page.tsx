import { redirect } from 'next/navigation';
import {
  isLiteLLMConfigured,
  listLiteLLMVirtualKeys,
  type LiteLLMVirtualKey,
} from '@/lib/litellm/client';
import { getUser } from '@/lib/db/queries';
import { KeyManager } from './key-manager';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const configured = isLiteLLMConfigured();
  let keys: LiteLLMVirtualKey[] = [];
  let loadError = false;

  if (configured) {
    try {
      keys = await listLiteLLMVirtualKeys(user.id);
    } catch (error) {
      console.error('Unable to load LiteLLM keys', error);
      loadError = true;
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div>
        <p className="text-sm text-gray-500">Access</p>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          These are JEV VIP keys backed by LiteLLM Virtual Keys. Your upstream
          TypeSafe credential is never exposed.
        </p>
      </div>

      <div className="mt-6">
        <KeyManager
          initialKeys={keys}
          configured={configured}
          loadError={loadError}
        />
      </div>
    </section>
  );
}
