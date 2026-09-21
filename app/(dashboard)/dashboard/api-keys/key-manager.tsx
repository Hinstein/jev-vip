'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/i18n/use-i18n';

type KeyItem = {
  id: number;
  name: string;
  key: string;
  status: number;
  created_time: number;
  used_quota: number;
  remain_quota: number;
  unlimited_quota: boolean;
};

export function KeyManager({
  initialKeys,
  configured,
}: {
  initialKeys: KeyItem[];
  configured: boolean;
}) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [name, setName] = useState('Default');
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !configured) return;

    setPending(true);
    setError(null);
    setNewKey(null);

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const payload = (await response.json()) as {
        key?: string;
        error?: string;
      };

      if (!response.ok || !payload.key) {
        throw new Error(payload.error || t('apiKeys.createError'));
      }

      setNewKey(payload.key);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t('apiKeys.createError')
      );
    } finally {
      setPending(false);
    }
  }

  async function deleteKey(tokenId: number) {
    if (deleting !== null) return;

    setDeleting(tokenId);
    setError(null);

    try {
      const response = await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || t('apiKeys.revokeError'));
      }

      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t('apiKeys.revokeError')
      );
    } finally {
      setDeleting(null);
    }
  }

  async function copyKey() {
    if (newKey) await navigator.clipboard.writeText(newKey);
  }

  return (
    <div className="space-y-6">
      {!configured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t('apiKeys.backendNotConfigured')}
        </div>
      ) : null}

      <form
        onSubmit={createKey}
        className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          placeholder={t('apiKeys.keyName')}
          disabled={!configured || pending}
        />
        <Button
          type="submit"
          disabled={!configured || pending || name.trim().length === 0}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {t('apiKeys.create')}
        </Button>
      </form>

      {newKey ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-950">
            {t('apiKeys.copyNow')}
          </p>
          <div className="mt-3 flex gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 text-sm">
              {newKey}
            </code>
            <Button type="button" variant="outline" onClick={copyKey}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">{t('apiKeys.copyKey')}</span>
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white">
        {initialKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <KeyRound className="h-8 w-8 text-gray-400" />
            <p className="mt-4 font-medium">{t('apiKeys.noKeys')}</p>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              {t('apiKeys.noKeysDescription')}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {initialKeys.map((key) => (
              <div
                key={key.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{key.name || t('apiKeys.unnamed')}</p>
                  <p className="mt-1 font-mono text-sm text-gray-500">
                    {key.key}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {key.created_time
                      ? new Date(key.created_time * 1000).toLocaleString(locale)
                      : t('apiKeys.creationTimeUnavailable')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleting === key.id}
                  onClick={() => deleteKey(key.id)}
                >
                  {deleting === key.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t('apiKeys.revoke')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
