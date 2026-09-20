import 'server-only';

export type JevProduct = {
  id: string;
  name: string;
  priceMinor: number;
  currency: 'CNY';
  credits: number;
  purchaseUrl: string | null;
};

export function getActiveProducts(): JevProduct[] {
  return [
    {
      id: 'jev-cny-10',
      name: 'Starter',
      priceMinor: 1000,
      currency: 'CNY',
      credits: 750_000,
      purchaseUrl: process.env.XIANYU_STARTER_URL || null,
    },
    {
      id: 'jev-cny-30',
      name: 'Standard',
      priceMinor: 3000,
      currency: 'CNY',
      credits: 2_250_000,
      purchaseUrl: process.env.XIANYU_STANDARD_URL || null,
    },
    {
      id: 'jev-cny-50',
      name: 'Pro',
      priceMinor: 5000,
      currency: 'CNY',
      credits: 3_750_000,
      purchaseUrl: process.env.XIANYU_PRO_URL || null,
    },
  ];
}
