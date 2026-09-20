'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatUsdFromQuota } from '@/lib/jev/billing';

type RedeemResponse =
  | {
      ok: true;
      productName: string;
      credited: number;
      balance: number;
      alreadyApplied: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export function RedeemForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RedeemResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim();
    if (!normalized || pending) return;

    setPending(true);
    setResult(null);

    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized }),
      });
      const payload = (await response.json()) as RedeemResponse;
      setResult(payload);

      if (payload.ok) {
        setCode('');
        router.refresh();
      }
    } catch {
      setResult({
        ok: false,
        code: 'network_error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="voucher-code">Redemption code</Label>
        <Input
          id="voucher-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="JEV10-X82K-PQ91"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="mt-2 font-mono"
          maxLength={128}
          required
        />
      </div>

      <Button type="submit" disabled={pending || code.trim().length < 4}>
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
          {result.ok ? (
            result.alreadyApplied ? (
              <p>
                This code was already processed for your account. Current
                balance: {formatUsdFromQuota(result.balance)}.
              </p>
            ) : (
              <p>
                Recharge successful: +{formatUsdFromQuota(result.credited)}.
                Current balance: {formatUsdFromQuota(result.balance)}.
              </p>
            )
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      ) : null}
    </form>
  );
}
