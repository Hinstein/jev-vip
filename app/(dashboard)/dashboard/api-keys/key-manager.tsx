'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope, NewApiToken, PageData } from '@/lib/new-api/types';

function extractItems(payload: ApiEnvelope<PageData<NewApiToken> | NewApiToken[]>) {
  if (Array.isArray(payload.data)) return payload.data;
  return payload.data?.items ?? [];
}

export function KeyManager() {
  const { user, authFetch } = useAuth();
  const [keys, setKeys] = useState<NewApiToken[]>([]);
  const [name, setName] = useState('Default');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const response = await authFetch('/api/token/?p=1&page_size=100');
    const payload = (await response.json()) as ApiEnvelope<
      PageData<NewApiToken> | NewApiToken[]
    >;
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Unable to load API keys.');
    }
    const items = extractItems(payload);
    setKeys(items);
    return items;
  }, [authFetch]);

  useEffect(() => {
    void loadKeys()
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load API keys.')
      )
      .finally(() => setLoading(false));
  }, [loadKeys]);

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !user) return;

    setPending(true);
    setError(null);
    setNewKey(null);

    try {
      const before = new Set(keys.map((key) => key.id));
      const response = await authFetch('/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          expired_time: -1,
          remain_quota: 0,
          unlimited_quota: true,
          model_limits_enabled: false,
          model_limits: '',
          allow_ips: '',
          group: user.group || 'default',
          cross_group_retry: false,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to create API key.');
      }

      const after = await loadKeys();
      const created =
        after.find((item) => !before.has(item.id)) ??
        after.find((item) => item.name === name.trim());
      if (!created) {
        throw new Error('Key was created but could not be reloaded.');
      }

      const revealResponse = await authFetch(`/api/token/${created.id}/key`, {
        method: 'POST',
      });
      const revealPayload = (await revealResponse.json()) as ApiEnvelope<{ key: string }>;
      if (!revealResponse.ok || !revealPayload.success || !revealPayload.data?.key) {
        throw new Error(
          'Key was created. Reload the list and use the reveal action in New API if needed.'
        );
      }
      setNewKey(revealPayload.data.key);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create API key.');
    } finally {
      setPending(false);
    }
  }

  async function deleteKey(id: number) {
    if (deleting) return;
    setDeleting(id);
    setError(null);
    try {
      const response = await authFetch(`/api/token/${id}`, { method: 'DELETE' });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to revoke API key.');
      }
      await loadKeys();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to revoke API key.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createKey} className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          required
          placeholder="Key name"
        />
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create key
        </Button>
      </form>

      {newKey ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900">New API key</p>
          <div className="mt-2 flex gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-white px-3 py-2 text-sm">
              {newKey}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigator.clipboard.writeText(newKey)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-green-800">
            Save this value securely. The normal list only shows a masked token.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-xl border bg-white">
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <KeyRound className="h-7 w-7 text-gray-400" />
            <p className="mt-3 font-medium">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{key.name}</p>
                  <code className="text-xs text-gray-500">{key.key}</code>
                  <p className="mt-1 text-xs text-gray-500">
                    Used {new Intl.NumberFormat('en-US').format(key.used_quota || 0)}
                    {key.unlimited_quota
                      ? ' · no per-key limit'
                      : ` · remaining ${new Intl.NumberFormat('en-US').format(key.remain_quota || 0)}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    key.status === 1
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {key.status === 1 ? 'Active' : 'Disabled'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={deleting === key.id}
                  onClick={() => void deleteKey(key.id)}
                >
                  {deleting === key.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
