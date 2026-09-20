'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope } from '@/lib/new-api/types';

export default function GeneralPage() {
  const { user, authFetch, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.display_name || user?.username || '');
  }, [user]);

  if (!user) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const response = await authFetch('/api/user/self', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          display_name: displayName.trim(),
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to update account.');
      }
      await refreshUser();
      setMessage('Account updated.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to update account.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Account
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label>Username</Label>
              <Input value={user.username} disabled className="mt-1" />
            </div>
            <div>
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={20}
                className="mt-1"
              />
            </div>
            {user.email ? (
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled className="mt-1" />
              </div>
            ) : null}
            {message ? <p className="text-sm text-gray-600">{message}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
