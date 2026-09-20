'use client';

import { FormEvent, useState } from 'react';
import { Loader2, TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth/auth-provider';
import type { ApiEnvelope } from '@/lib/new-api/types';

export function RedeemForm() {
  const { authFetch, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !code.trim()) return;

    setPending(true);
    setResult(null);
    try {
      const response = await authFetch('/api/user/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: code.trim() }),
      });
      const payload = (await response.json()) as ApiEnvelope<number>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to redeem this code.');
      }

      await refreshUser();
      setCode('');
      setResult({
        ok: true,
        message: `Redeemed successfully. +${new Intl.NumberFormat('en-US').format(payload.data || 0)} credits.`,
      });
    } catch (cause) {
      setResult({
        ok: false,
        message: cause instanceof Error ? cause.message : 'Unable to redeem this code.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        autoComplete="off"
        placeholder="Enter redemption code"
        minLength={4}
        maxLength={128}
        required
      />
      <Button type="submit" disabled={pending || !code.trim()} className="w-full">
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redeeming...
          </>
        ) : (
          <>
            <TicketCheck className="mr-2 h-4 w-4" />
            Redeem now
          </>
        )}
      </Button>

      {result ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            result.ok
              ? 'border-green-200 bg-green-50 text-green-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {result.message}
        </div>
      ) : null}
    </form>
  );
}
