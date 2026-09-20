import 'server-only';
import type { VoucherProvider } from './types';
import { OfferKitVoucherProvider } from './offerkit';

export function getVoucherProvider(): VoucherProvider {
  return new OfferKitVoucherProvider();
}

export * from './types';
