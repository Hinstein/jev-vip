export type DisplayProduct = {
  id: string;
  name: string;
  priceMinor: number;
  currency: string;
  credits: number;
  purchaseUrl?: string;
};

export const productConfig = {
  name: 'JEV VIP',
  description:
    'Independent prepaid access and account management for Jev users.',
  dashboardDescription:
    'Manage credits, API keys, usage and redemption from one place.',
  officialDisclaimer:
    'JEV VIP is an independent service and is not affiliated with or operated by TypeSafe AI.',
} as const;

export const products: DisplayProduct[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMinor: 1000,
    currency: 'CNY',
    credits: 1_000_000,
    purchaseUrl: process.env.NEXT_PUBLIC_XIANYU_STARTER_URL,
  },
  {
    id: 'standard',
    name: 'Standard',
    priceMinor: 3000,
    currency: 'CNY',
    credits: 3_500_000,
    purchaseUrl: process.env.NEXT_PUBLIC_XIANYU_STANDARD_URL,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMinor: 5000,
    currency: 'CNY',
    credits: 6_000_000,
    purchaseUrl: process.env.NEXT_PUBLIC_XIANYU_PRO_URL,
  },
];
