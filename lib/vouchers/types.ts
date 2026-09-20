export type VoucherLookupResult = {
  campaignId: string;
};

export type VoucherRedeemInput = {
  code: string;
  userExternalId: string;
  idempotencyKey: string;
};

export type VoucherRedeemResult =
  | {
      ok: true;
      providerRedemptionId?: string;
      idempotent: boolean;
    }
  | {
      ok: false;
      code?: string;
      message?: string;
    };

export interface VoucherProvider {
  lookup(code: string): Promise<VoucherLookupResult>;
  redeem(input: VoucherRedeemInput): Promise<VoucherRedeemResult>;
}

export class VoucherProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'VoucherProviderError';
  }
}
