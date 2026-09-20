import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey } from '@/lib/api-keys/service';
import { getCreditBalance } from '@/lib/credits/queries';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { recordUsageAndDebit } from '@/lib/usage/service';
import { getUsageEventByRequestId } from '@/lib/usage/queries';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

export const runtime = 'nodejs';

function relayBaseUrl() {
  return process.env.LITELLM_PROXY_URL?.replace(/\/+$/, '') || null;
}

function getBearerToken(header: string | null) {
  const match = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? '');
  return match?.[1] ?? null;
}

function getRequestId(request: NextRequest) {
  const supplied = request.headers.get('x-request-id')?.trim();
  if (supplied && supplied.length <= 128 && /^[\x21-\x7e]+$/.test(supplied)) {
    return supplied;
  }

  return randomUUID();
}

function responseHeaders(requestId: string) {
  return { 'X-JEV-Request-ID': requestId };
}

function asNonNegativeInteger(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function extractUsage(payload: Record<string, unknown>) {
  const usage =
    payload.usage && typeof payload.usage === 'object'
      ? (payload.usage as Record<string, unknown>)
      : null;

  if (!usage) return null;

  const inputTokens =
    asNonNegativeInteger(usage.prompt_tokens) ??
    asNonNegativeInteger(usage.input_tokens);
  const outputTokens =
    asNonNegativeInteger(usage.completion_tokens) ??
    asNonNegativeInteger(usage.output_tokens);
  const reportedTotal = asNonNegativeInteger(usage.total_tokens);
  const totalTokens =
    reportedTotal ??
    (inputTokens !== null && outputTokens !== null
      ? inputTokens + outputTokens
      : null);

  if (inputTokens === null || outputTokens === null || totalTokens === null) {
    return null;
  }

  return { inputTokens, outputTokens, totalTokens };
}

async function readJsonBody(request: NextRequest) {
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return { error: 'Request body is too large.', status: 413 } as const;
    }
  }

  let rawBody: ArrayBuffer;
  try {
    rawBody = await request.arrayBuffer();
  } catch {
    return { error: 'Invalid JSON request body.', status: 400 } as const;
  }

  if (rawBody.byteLength > MAX_BODY_BYTES) {
    return { error: 'Request body is too large.', status: 413 } as const;
  }

  try {
    return { body: JSON.parse(new TextDecoder().decode(rawBody)) as unknown };
  } catch {
    return { error: 'Invalid JSON request body.', status: 400 } as const;
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const headers = responseHeaders(requestId);
  const presentedKey = getBearerToken(request.headers.get('authorization'));

  if (!presentedKey) {
    return NextResponse.json(
      { error: 'Missing API key.' },
      { status: 401, headers }
    );
  }

  if (presentedKey.length > 256) {
    return NextResponse.json(
      { error: 'Invalid API key.' },
      { status: 401, headers }
    );
  }

  const resolved = await resolveApiKey(presentedKey);
  if (!resolved.ok) {
    return NextResponse.json(
      {
        error:
          resolved.reason === 'unavailable'
            ? 'API key service is temporarily unavailable.'
            : 'Invalid API key.',
      },
      { status: resolved.reason === 'unavailable' ? 503 : 401, headers }
    );
  }

  const rateLimit = checkRateLimit(
    `decide:key:${resolved.apiKey.id}`,
    120,
    60 * 1000
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const existingUsage = await getUsageEventByRequestId(
    resolved.apiKey.id,
    requestId
  );
  if (existingUsage) {
    return NextResponse.json(
      {
        error:
          existingUsage.status === 'INSUFFICIENT_CREDITS'
            ? 'This request was rejected because the account had insufficient JEV Credits.'
            : 'This X-Request-ID has already been used. Choose a new request id.',
      },
      {
        status: existingUsage.status === 'INSUFFICIENT_CREDITS' ? 402 : 409,
        headers,
      }
    );
  }

  const baseUrl = relayBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'JEV relay is not configured.' },
      { status: 503, headers }
    );
  }

  const parsedBody = await readJsonBody(request);
  if ('error' in parsedBody) {
    return NextResponse.json(
      { error: parsedBody.error },
      { status: parsedBody.status, headers }
    );
  }

  if (
    !parsedBody.body ||
    typeof parsedBody.body !== 'object' ||
    Array.isArray(parsedBody.body)
  ) {
    return NextResponse.json(
      { error: 'Request body must be a JSON object.' },
      { status: 400, headers }
    );
  }

  const balance = await getCreditBalance(resolved.user.id);
  if (balance <= 0) {
    return NextResponse.json(
      {
        error: 'Insufficient JEV Credits for this request.',
        creditsRemaining: balance,
      },
      {
        status: 402,
        headers: {
          ...headers,
          'X-JEV-Credits-Remaining': String(balance),
        },
      }
    );
  }

  let relayResponse: Response;
  try {
    relayResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${presentedKey}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
      body: JSON.stringify({
        model: 'jev',
        messages: [
          {
            role: 'user',
            content: JSON.stringify(parsedBody.body),
          },
        ],
        stream: false,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    return NextResponse.json(
      { error: 'JEV relay is temporarily unavailable.' },
      { status: 503, headers }
    );
  }

  const relayText = await relayResponse.text();

  if (!relayResponse.ok) {
    let errorBody: unknown = { error: 'JEV relay request failed.' };
    if (relayText) {
      try {
        errorBody = JSON.parse(relayText);
      } catch {
        errorBody = { error: relayText.slice(0, 1000) };
      }
    }

    return NextResponse.json(errorBody, {
      status: relayResponse.status,
      headers,
    });
  }

  let relayJson: Record<string, unknown>;
  let jevResponse: unknown;
  try {
    relayJson = JSON.parse(relayText) as Record<string, unknown>;
    const content =
      relayJson.choices && Array.isArray(relayJson.choices)
        ? (relayJson.choices[0] as Record<string, unknown> | undefined)
            ?.message
        : null;
    const contentValue =
      content && typeof content === 'object'
        ? (content as Record<string, unknown>).content
        : null;

    if (typeof contentValue !== 'string') {
      throw new Error('Missing relay content');
    }

    jevResponse = JSON.parse(contentValue);
  } catch {
    return NextResponse.json(
      { error: 'JEV relay returned an invalid response.' },
      { status: 502, headers }
    );
  }

  const usage = extractUsage(relayJson);
  if (!usage || usage.totalTokens <= 0) {
    return NextResponse.json(
      { error: 'JEV relay did not return billable token usage.' },
      { status: 502, headers }
    );
  }

  let metering;
  try {
    metering = await recordUsageAndDebit({
      userId: resolved.user.id,
      apiKeyId: resolved.apiKey.id,
      requestId,
      model: typeof relayJson.model === 'string' ? relayJson.model : 'jev',
      ...usage,
    });
  } catch (error) {
    console.error('Failed to record JEV usage', error);
    return NextResponse.json(
      { error: 'Usage ledger is temporarily unavailable. Please retry.' },
      { status: 503, headers }
    );
  }

  if (metering.status === 'duplicate') {
    return NextResponse.json(
      { error: 'This X-Request-ID has already been metered.' },
      { status: 409, headers }
    );
  }

  if (metering.status === 'insufficient_credits') {
    return NextResponse.json(
      {
        error: 'Insufficient JEV Credits for this request.',
        creditsRequired: metering.credits,
        creditsRemaining: metering.balance,
      },
      {
        status: 402,
        headers: {
          ...headers,
          'X-JEV-Credits-Required': String(metering.credits),
          'X-JEV-Credits-Remaining': String(metering.balance),
        },
      }
    );
  }

  return NextResponse.json(jevResponse, {
    headers: {
      ...headers,
      'X-JEV-Credits-Used': String(metering.credits),
      'X-JEV-Credits-Remaining': String(metering.balance),
    },
  });
}
