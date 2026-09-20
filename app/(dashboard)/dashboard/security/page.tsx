'use client';

import { useCallback, useEffect, useState } from 'react';
import { Laptop, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope, NewApiSession } from '@/lib/new-api/types';

export default function SecurityPage() {
  const { authFetch } = useAuth();
  const [sessions, setSessions] = useState<NewApiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const response = await authFetch('/api/user/sessions');
    const payload = (await response.json()) as ApiEnvelope<
      NewApiSession[] | { items?: NewApiSession[] }
    >;
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Unable to load login sessions.');
    }
    const data = payload.data;
    setSessions(Array.isArray(data) ? data : data?.items ?? []);
  }, [authFetch]);

  useEffect(() => {
    void loadSessions()
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load sessions.')
      )
      .finally(() => setLoading(false));
  }, [loadSessions]);

  async function revokeOthers() {
    setPending(true);
    setError(null);
    try {
      const response = await authFetch('/api/user/sessions/revoke-others', {
        method: 'POST',
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to revoke other sessions.');
      }
      await loadSessions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to revoke sessions.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Login Sessions
      </h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active sessions
          </CardTitle>
          <Button variant="outline" onClick={() => void revokeOthers()} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Revoke others
          </Button>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-gray-500">No session data returned.</p>
          ) : (
            <div className="divide-y">
              {sessions.map((session, index) => (
                <div key={session.sid ?? index} className="flex gap-3 py-3">
                  <Laptop className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {session.login_method || 'Login session'}
                      {session.current ? ' · Current' : ''}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {session.ip || 'Unknown IP'}
                      {session.user_agent ? ` · ${session.user_agent}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
