export const productConfig = {
  name: 'JEV VIP',
  description:
    'Independent prepaid access and account management for Jev users.',
  dashboardDescription:
    'Manage credits, API keys, usage and top-up orders from one place.',
  officialDisclaimer:
    'JEV VIP is an independent service and is not affiliated with or operated by TypeSafe AI.'
} as const;

export const creditPacks = [
  { amount: 5, label: '$5 credits', popular: false },
  { amount: 10, label: '$10 credits', popular: false },
  { amount: 20, label: '$20 credits', popular: true },
  { amount: 50, label: '$50 credits', popular: false }
] as const;

export const dashboardPlaceholderMetrics = {
  balanceUsd: 0,
  requests: 0,
  inputTokens: 0,
  activeKeys: 0
} as const;
