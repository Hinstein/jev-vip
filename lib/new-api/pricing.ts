import 'server-only';

export type JevRetailPricing = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

type NewApiPricingModel = {
  model_name?: string;
  quota_type?: number;
  model_ratio?: number;
  completion_ratio?: number;
  billing_mode?: string;
  billing_expr?: string;
};

type NewApiPricingResponse = {
  success?: boolean;
  data?: NewApiPricingModel[];
};

function baseUrl() {
  const value = process.env.NEW_API_BASE_URL?.replace(/\/+$/, '');
  if (!value) throw new Error('New API backend is not configured');
  return value;
}

function parseSimpleExpression(expression: string): JevRetailPricing | null {
  // JEV V1 uses the canonical simple token expression:
  // tier("base", p * <input $/M> + c * <output $/M>)
  const p = expression.match(/\bp\s*\*\s*([0-9]+(?:\.[0-9]+)?)/i);
  const c = expression.match(/\bc\s*\*\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!p || !c) return null;

  const inputUsdPerMillion = Number(p[1]);
  const outputUsdPerMillion = Number(c[1]);
  if (
    !Number.isFinite(inputUsdPerMillion) ||
    inputUsdPerMillion < 0 ||
    !Number.isFinite(outputUsdPerMillion) ||
    outputUsdPerMillion < 0
  ) {
    return null;
  }

  return { inputUsdPerMillion, outputUsdPerMillion };
}

export async function getJevRetailPricing(): Promise<JevRetailPricing> {
  const response = await fetch(`${baseUrl()}/api/pricing`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) {
    throw new Error(`New API pricing unavailable: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as NewApiPricingResponse;
  if (payload.success === false || !Array.isArray(payload.data)) {
    throw new Error('New API pricing response is invalid');
  }

  const modelName = process.env.NEW_API_JEV_MODEL || 'jev';
  const model = payload.data.find((entry) => entry.model_name === modelName);
  if (!model) {
    throw new Error(`Jev model pricing is not configured for ${modelName}`);
  }

  if (model.billing_mode === 'tiered_expr' && model.billing_expr) {
    const parsed = parseSimpleExpression(model.billing_expr);
    if (!parsed) {
      throw new Error(
        'Jev uses a pricing expression the JEV storefront cannot display safely'
      );
    }
    return parsed;
  }

  if (
    model.quota_type === 0 &&
    Number.isFinite(model.model_ratio) &&
    Number.isFinite(model.completion_ratio)
  ) {
    // In New API legacy token-ratio billing, ModelRatio=1 corresponds to
    // $2/M input tokens because 1 USD = 500,000 quota.
    const inputUsdPerMillion = Number(model.model_ratio) * 2;
    const outputUsdPerMillion =
      inputUsdPerMillion * Number(model.completion_ratio);

    return { inputUsdPerMillion, outputUsdPerMillion };
  }

  throw new Error('Jev token pricing is not configured in a supported mode');
}
