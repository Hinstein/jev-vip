import 'server-only';
import { createHash } from 'node:crypto';
import { applyCreditTransaction } from '@/lib/credits/service';
import {
  getProductByOfferKitCampaignId,
} from '@/lib/credits/queries';
import {
  getVoucherProvider,
  VoucherProviderError,
} from '@/lib/vouchers';

export type RedeemVoucherResult =
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
      retryable?: boolean;
    };

const customerMessages: Record<string, string> = {
  voucher_not_found: 'This redemption code was not found.',
  campaign_inactive: 'This redemption campaign is not active.',
  voucher_disabled: 'This redemption code has been disabled.',
  voucher_expired: 'This redemption code has expired.',
  redemption_limit_reached: 'This redemption code has already been used.',
  per_user_redemption_limit_reached:
    'This redemption code cannot be used again by this account.',
};

function toFailure(error: unknown): RedeemVoucherResult {
  if (error instanceof VoucherProviderError) {
    const message =
      customerMessages[error.code] ??
      (error.code.startsWith('provider_')
        ? 'The redemption service is temporarily unavailable. Please try again.'
        : 'This redemption code could not be redeemed.');

    return {
      ok: false,
      code: error.code,
      message,
      retryable: error.code.startsWith('provider_'),
    };
  }

  console.error('Unexpected voucher redemption error');
  return {
    ok: false,
    code: 'internal_error',
    message: 'Something went wrong while redeeming the code. Please try again.',
    retryable: true,
  };
}

export async function redeemVoucherForUser(
  userId: number,
  submittedCode: string
): Promise<RedeemVoucherResult> {
  const code = submittedCode.trim();
  const codeHash = createHash('sha256').update(code).digest('hex');
  const idempotencyKey = `jev-redeem-v1-${userId}-${codeHash.slice(0, 32)}`;
  const referenceId = `offerkit:${idempotencyKey}`;
  const provider = getVoucherProvider();

  try {
    const voucher = await provider.lookup(code);
    const product = await getProductByOfferKitCampaignId(voucher.campaignId);

    if (!product || !product.active) {
      return {
        ok: false,
        code: 'campaign_not_mapped',
        message:
          'This code belongs to a campaign that is not enabled for JEV Credits.',
      };
    }

    const redemption = await provider.redeem({
      code,
      userExternalId: String(userId),
      idempotencyKey,
    });

    if (!redemption.ok) {
      return {
        ok: false,
        code: redemption.code ?? 'redemption_rejected',
        message:
          (redemption.code && customerMessages[redemption.code]) ||
          redemption.message ||
          'This redemption code could not be redeemed.',
      };
    }

    const ledger = await applyCreditTransaction({
      userId,
      productId: product.id,
      type: 'REDEEM',
      amount: product.credits,
      source: 'OFFERKIT',
      referenceId,
      providerReferenceId: redemption.providerRedemptionId,
      campaignId: voucher.campaignId,
      voucherCodeHash: codeHash,
      voucherCodeLast4: code.slice(-4),
    });

    return {
      ok: true,
      productName: product.name,
      credited: ledger.applied ? product.credits : 0,
      balance: ledger.balance,
      alreadyApplied: !ledger.applied,
    };
  } catch (error) {
    return toFailure(error);
  }
}
