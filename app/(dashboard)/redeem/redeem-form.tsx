'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TicketCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatUsdFromQuota } from '@/lib/jev/billing';
import { useI18n } from '@/components/i18n/use-i18n';

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
  const { locale, t } = useI18n();
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
        message: t('redeem.networkError'),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="voucher-code">{t('redeem.redemptionCode')}</Label>
        <Input
          id="voucher-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t('redeem.placeholder')}
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
            {t('redeem.redeeming')}
          </>
        ) : (
          <>
            <TicketCheck className="mr-2 h-4 w-4" />
            {t('redeem.redeemNow')}
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
                {t('redeem.alreadyProcessed', {
                  balance: formatUsdFromQuota(result.balance, locale),
                })}
              </p>
            ) : (
              <p>
                {t('redeem.successful', {
                  credited: formatUsdFromQuota(result.credited, locale),
                  balance: formatUsdFromQuota(result.balance, locale),
                })}
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
