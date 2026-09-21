import 'server-only';
import {
  type VoucherLookupResult,
  type VoucherProvider,
  VoucherProviderError,
  type VoucherRedeemInput,
  type VoucherRedeemResult,
} from './types';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function unwrap(value: unknown): JsonRecord {
  const root = asRecord(value) ?? {};
  return asRecord(root.data) ?? asRecord(root.result) ?? root;
}

function readString(record: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function extractDomainCode(payload: unknown) {
  const result = unwrap(payload);
  const direct = readString(result, 'code', 'errorCode');
  if (direct) return direct;

  const explanations = Array.isArray(result.explanations)
    ? result.explanations
    : [];
  for (const item of explanations) {
    const record = asRecord(item);
    if (!record) continue;
    const code = readString(record, 'code');
    if (code) return code;
  }

  return undefined;
}

function getConfig() {
  const baseUrl = process.env.OFFERKIT_API_URL?.trim().replace(/\/+$/, '');
  const apiKey = process.env.OFFERKIT_API_KEY?.trim();

  if (!baseUrl || !apiKey) {
    throw new VoucherProviderError(
      'provider_not_configured',
      'OfferKit is not configured'
    );
  }

  const amountMinor = Number(
    process.env.OFFERKIT_REDEEM_AMOUNT_MINOR?.trim() ?? '1'
  );
  const currency = process.env.OFFERKIT_REDEEM_CURRENCY?.trim() || 'CNY';

  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new VoucherProviderError(
      'provider_not_configured',
      'OFFERKIT_REDEEM_AMOUNT_MINOR must be a positive integer'
    );
  }

  return { baseUrl, apiKey, amountMinor, currency };
}

async function requestOfferKit(path: string, init?: RequestInit) {
  const { baseUrl, apiKey } = getConfig();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new VoucherProviderError(
      'provider_unavailable',
      'Voucher service is temporarily unavailable'
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const domainCode =
      extractDomainCode(payload) ??
      (response.status === 404 ? 'voucher_not_found' : undefined);

    if (response.status === 401 || response.status === 403) {
      throw new VoucherProviderError(
        'provider_auth_failed',
        'Voucher service authentication failed',
        response.status
      );
    }

    throw new VoucherProviderError(
      domainCode ?? 'provider_error',
      'Voucher service rejected the request',
      response.status
    );
  }

  return payload;
}

export class OfferKitVoucherProvider implements VoucherProvider {
  async lookup(code: string): Promise<VoucherLookupResult> {
    const payload = await requestOfferKit(
      `/api/v1/vouchers/${encodeURIComponent(code)}`
    );
    const voucher = unwrap(payload);
    const campaign = asRecord(voucher.campaign);
    const campaignId =
      readString(voucher, 'campaignId', 'campaign_id') ??
      (campaign ? readString(campaign, 'id') : undefined);

    if (!campaignId) {
      throw new VoucherProviderError(
        'provider_invalid_response',
        'OfferKit voucher response did not include a campaign id'
      );
    }

    return { campaignId };
  }

  async redeem(input: VoucherRedeemInput): Promise<VoucherRedeemResult> {
    const { amountMinor, currency } = getConfig();
    const externalOrderId = `jev-${input.userExternalId}-${input.idempotencyKey
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-24)}`;

    const payload = await requestOfferKit(
      `/api/v1/vouchers/${encodeURIComponent(input.code)}/redemption`,
      {
        method: 'POST',
        body: JSON.stringify({
          customerExternalId: input.userExternalId,
          externalOrderId,
          idempotencyKey: input.idempotencyKey,
          order: {
            amount: amountMinor,
            currency,
            items: [],
          },
        }),
      }
    );

    const result = unwrap(payload);

    if (result.ok !== true) {
      return {
        ok: false,
        code: extractDomainCode(payload),
        message: readString(result, 'message'),
      };
    }

    const redemption = asRecord(result.redemption);
    const providerRedemptionId =
      readString(result, 'redemptionId') ??
      (redemption ? readString(redemption, 'id') : undefined);

    return {
      ok: true,
      providerRedemptionId,
      idempotent: result.idempotent === true,
    };
  }
}
