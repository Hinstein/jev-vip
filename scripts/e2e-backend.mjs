import { randomBytes } from 'node:crypto';

const EXPECTED_QUOTA_PER_USD = 500_000;
const EXPECTED_INPUT_USD_PER_MILLION = 0.42;
const EXPECTED_OUTPUT_USD_PER_MILLION = 0;

const newApiBase = (process.env.NEW_API_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const jevBase = (process.env.JEV_E2E_BASE_URL || process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const redemptionCode = process.env.JEV_E2E_REDEMPTION_CODE;

if (!redemptionCode) {
  throw new Error('JEV_E2E_REDEMPTION_CODE is required. Use a disposable New API redemption code.');
}

const suffix = Date.now().toString(36);
const username = process.env.JEV_E2E_USERNAME || `jev_e2e_${suffix}`;
const password =
  process.env.JEV_E2E_PASSWORD ||
  `JevE2E-${randomBytes(12).toString('base64url')}!9`;

async function jsonRequest(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  return { response, body };
}

function requireSuccess(result, label) {
  if (!result.response.ok || result.body?.success === false) {
    throw new Error(
      `${label} failed: HTTP ${result.response.status} ${JSON.stringify(result.body)}`
    );
  }
  return result.body?.data;
}

async function register() {
  const result = await jsonRequest(`${newApiBase}/api/user/register`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (!result.response.ok || result.body?.success === false) {
    const message = String(result.body?.message || '');
    if (!/exist|已存在|already/i.test(message)) {
      throw new Error(
        `register failed: HTTP ${result.response.status} ${JSON.stringify(result.body)}`
      );
    }
  }
}

async function login() {
  const result = await jsonRequest(`${newApiBase}/api/user/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const data = requireSuccess(result, 'login');
  if (!data?.access_token) {
    throw new Error('login did not return access_token; disable extra login verification for E2E user');
  }
  return data.access_token;
}

async function api(accessToken, path, init = {}) {
  const result = await jsonRequest(`${newApiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });
  return requireSuccess(result, path);
}

async function self(accessToken) {
  return api(accessToken, '/api/user/self');
}

function pageItems(data) {
  if (Array.isArray(data)) return data;
  return data?.items || data?.data || data?.tokens || [];
}

async function assertAccountingUnit() {
  const result = await jsonRequest(`${newApiBase}/api/status`);
  const data = requireSuccess(result, '/api/status');
  const quotaPerUnit = Number(data?.quota_per_unit);
  if (quotaPerUnit !== EXPECTED_QUOTA_PER_USD) {
    throw new Error(
      `QuotaPerUnit must be ${EXPECTED_QUOTA_PER_USD}; got ${quotaPerUnit}`
    );
  }
}

function parseExpressionPricing(expression) {
  const input = expression.match(/\bp\s*\*\s*([0-9]+(?:\.[0-9]+)?)/i);
  const output = expression.match(/\bc\s*\*\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (!input || !output) return null;
  return {
    inputUsdPerMillion: Number(input[1]),
    outputUsdPerMillion: Number(output[1]),
  };
}

async function currentPricing() {
  const result = await jsonRequest(`${newApiBase}/api/pricing`);
  const payload = result.body;
  if (!result.response.ok || payload?.success === false || !Array.isArray(payload?.data)) {
    throw new Error(`pricing lookup failed: ${JSON.stringify(payload)}`);
  }

  const model = payload.data.find((entry) => entry.model_name === 'jev');
  if (!model) throw new Error('jev pricing is missing from New API');

  if (model.billing_mode === 'tiered_expr' && typeof model.billing_expr === 'string') {
    const parsed = parseExpressionPricing(model.billing_expr);
    if (!parsed) {
      throw new Error(`unsupported jev billing expression: ${model.billing_expr}`);
    }
    return parsed;
  }

  if (
    model.quota_type === 0 &&
    Number.isFinite(Number(model.model_ratio)) &&
    Number.isFinite(Number(model.completion_ratio))
  ) {
    const inputUsdPerMillion = Number(model.model_ratio) * 2;
    return {
      inputUsdPerMillion,
      outputUsdPerMillion:
        inputUsdPerMillion * Number(model.completion_ratio),
    };
  }

  throw new Error('unsupported jev pricing mode');
}

async function assertRetailPricing() {
  const pricing = await currentPricing();
  const epsilon = 1e-9;
  if (
    Math.abs(pricing.inputUsdPerMillion - EXPECTED_INPUT_USD_PER_MILLION) > epsilon ||
    Math.abs(pricing.outputUsdPerMillion - EXPECTED_OUTPUT_USD_PER_MILLION) > epsilon
  ) {
    throw new Error(
      `JEV V1 pricing mismatch: expected input=${EXPECTED_INPUT_USD_PER_MILLION}, output=${EXPECTED_OUTPUT_USD_PER_MILLION}; got input=${pricing.inputUsdPerMillion}, output=${pricing.outputUsdPerMillion}`
    );
  }
  return pricing;
}

async function createApiKey(accessToken) {
  const before = pageItems(
    await api(accessToken, '/api/token/?page=1&page_size=100')
  );
  const beforeIds = new Set(before.map((item) => item.id));
  const name = `jev-e2e-${suffix}`;

  await api(accessToken, '/api/token/', {
    method: 'POST',
    body: JSON.stringify({
      name,
      expired_time: -1,
      remain_quota: 0,
      unlimited_quota: true,
      model_limits_enabled: true,
      model_limits: 'jev',
      group: '',
    }),
  });

  const after = pageItems(
    await api(accessToken, '/api/token/?page=1&page_size=100')
  );
  const token = after.find(
    (item) => item.name === name && !beforeIds.has(item.id)
  );
  if (!token) throw new Error('could not identify newly-created New API key');

  const revealed = await api(accessToken, `/api/token/${token.id}/key`, {
    method: 'POST',
  });
  if (!revealed?.key) throw new Error('New API did not reveal the new key');

  return { id: token.id, key: revealed.key };
}

async function deleteApiKey(accessToken, id) {
  await api(accessToken, `/api/token/${id}`, { method: 'DELETE' });
}

function expectedQuota(inputTokens, inputUsdPerMillion) {
  return Math.round(
    (inputTokens / 1_000_000) *
      inputUsdPerMillion *
      EXPECTED_QUOTA_PER_USD
  );
}

async function main() {
  console.log('JEV backend E2E');
  console.log({ newApiBase, jevBase, username });

  await assertAccountingUnit();
  const pricing = await assertRetailPricing();

  if (!process.env.JEV_E2E_USERNAME) {
    await register();
  }

  const accessToken = await login();
  const initial = await self(accessToken);

  const credited = await api(accessToken, '/api/user/topup', {
    method: 'POST',
    body: JSON.stringify({ key: redemptionCode }),
  });
  const afterRedeem = await self(accessToken);

  if (!(Number(afterRedeem.quota) > Number(initial.quota))) {
    throw new Error(
      `redemption did not increase quota: before=${initial.quota}, after=${afterRedeem.quota}`
    );
  }

  const token = await createApiKey(accessToken);

  try {
    const decision = await jsonRequest(`${jevBase}/api/v1/decide`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.key}` },
      body: JSON.stringify({
        state: 'Customer: my card was charged twice',
        questions: {
          topic: {
            type: 'choice',
            instructions: 'Route this message',
            criteria: {
              billing: 'money',
              bug: 'broken',
              account: 'login',
            },
          },
        },
      }),
    });

    if (!decision.response.ok) {
      throw new Error(
        `JEV decision failed: HTTP ${decision.response.status} ${JSON.stringify(decision.body)}`
      );
    }

    const inputTokens = Number(decision.body?.usage?.input_tokens);
    if (!Number.isSafeInteger(inputTokens) || inputTokens <= 0) {
      throw new Error(
        `JEV response missing positive usage.input_tokens: ${JSON.stringify(decision.body?.usage)}`
      );
    }

    if (!decision.body?.answers || typeof decision.body.answers !== 'object') {
      throw new Error('JEV response is missing answers');
    }

    // The public facade must not expose upstream commercial/account fields.
    for (const forbidden of ['cost_usd', 'credits_remaining_usd', 'balance']) {
      if (Object.prototype.hasOwnProperty.call(decision.body, forbidden)) {
        throw new Error(`JEV response leaked upstream field: ${forbidden}`);
      }
    }

    const afterCall = await self(accessToken);
    const actualDelta = Number(afterRedeem.quota) - Number(afterCall.quota);
    const expected = expectedQuota(
      inputTokens,
      pricing.inputUsdPerMillion
    );

    if (actualDelta <= 0) {
      throw new Error(
        `successful JEV request did not consume quota: before=${afterRedeem.quota}, after=${afterCall.quota}`
      );
    }

    // New API settles quota to integer units. Allow a small rounding window.
    if (Math.abs(actualDelta - expected) > 2) {
      throw new Error(
        `billing mismatch: input_tokens=${inputTokens}, expected≈${expected}, actual=${actualDelta}`
      );
    }

    console.log('PASS', {
      credited,
      quotaBeforeRedeem: initial.quota,
      quotaAfterRedeem: afterRedeem.quota,
      inputTokens,
      inputUsdPerMillion: pricing.inputUsdPerMillion,
      expectedQuota: expected,
      actualQuota: actualDelta,
      remainingQuota: afterCall.quota,
      apiKeyId: token.id,
    });
  } finally {
    await deleteApiKey(accessToken, token.id);
  }
}

main().catch((error) => {
  console.error('FAIL', error);
  process.exitCode = 1;
});
