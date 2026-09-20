import { KeyManager } from './key-manager';

export default function ApiKeysPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div>
        <p className="text-sm text-gray-500">Access</p>
        <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Create and revoke New API tokens without exposing any upstream provider credential.
        </p>
      </div>
      <div className="mt-6">
        <KeyManager />
      </div>
    </section>
  );
}
