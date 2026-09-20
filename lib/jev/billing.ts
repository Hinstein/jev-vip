export const NEW_API_QUOTA_PER_USD = 500_000;
export const JEV_RETAIL_INPUT_USD_PER_MILLION = 0.42;
export const JEV_RETAIL_OUTPUT_USD_PER_MILLION = 0;

// V1 product catalog uses a fixed commercial conversion for CNY packs.
// This is a product rule, not a live FX feed: ¥1 grants 75,000 New API quota.
export const JEV_PACK_QUOTA_PER_CNY = 75_000;

export function quotaToUsd(quota: number) {
  return quota / NEW_API_QUOTA_PER_USD;
}

export function quotaToApproxInputTokens(
  quota: number,
  inputUsdPerMillion = JEV_RETAIL_INPUT_USD_PER_MILLION
) {
  if (!Number.isFinite(inputUsdPerMillion) || inputUsdPerMillion <= 0) {
    return 0;
  }
  return (quotaToUsd(quota) / inputUsdPerMillion) * 1_000_000;
}

export function formatUsdFromQuota(quota: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(quotaToUsd(quota));
}

export function formatApproxInputTokens(
  quota: number,
  inputUsdPerMillion = JEV_RETAIL_INPUT_USD_PER_MILLION
) {
  const tokens = quotaToApproxInputTokens(quota, inputUsdPerMillion);
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(0)}K`;
  }
  return Math.round(tokens).toString();
}

export function expectedQuotaForInputTokens(inputTokens: number) {
  return Math.round(
    (inputTokens / 1_000_000) *
      JEV_RETAIL_INPUT_USD_PER_MILLION *
      NEW_API_QUOTA_PER_USD
  );
}
