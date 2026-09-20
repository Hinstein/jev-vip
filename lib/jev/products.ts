import 'server-only';

import { JEV_PACK_QUOTA_PER_CNY } from './billing';

export type JevProduct = {
  id: string;
  name: string;
  priceMinor: number;
  currency: 'CNY';
  credits: number;
  purchaseUrl: string | null;
};

function pack(
  id: string,
  name: string,
  cny: number,
  purchaseUrl?: string
): JevProduct {
  return {
    id,
    name,
    priceMinor: cny * 100,
    currency: 'CNY',
    credits: cny * JEV_PACK_QUOTA_PER_CNY,
    purchaseUrl: purchaseUrl || null,
  };
}

export function getActiveProducts(): JevProduct[] {
  return [
    pack('jev-cny-10', 'Starter', 10, process.env.XIANYU_STARTER_URL),
    pack('jev-cny-30', 'Standard', 30, process.env.XIANYU_STANDARD_URL),
    pack('jev-cny-50', 'Pro', 50, process.env.XIANYU_PRO_URL),
  ];
}
