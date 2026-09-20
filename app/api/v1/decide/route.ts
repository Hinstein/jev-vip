import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function relayBaseUrl() {
  const value = process.env.LITELLM_PROXY_URL?.replace(/\/+$/, '');
  if (!value) {
    throw new Error('LiteLLM relay is not configured');
  }
  return value;
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing API key.' },
      { status: 401 }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body is too large.' },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Request body must be a JSON object.' },
      { status: 400 }
    );
  }

  let relayResponse: Response;
  try {
    relayResponse = await fetch(`${relayBaseUrl()}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jev',
        messages: [
          {
            role: 'user',
            content: JSON.stringify(body),
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
      { status: 503 }
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

    return NextResponse.json(errorBody, { status: relayResponse.status });
  }

  try {
    const relayJson = JSON.parse(relayText) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = relayJson.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error('Missing relay content');
    }

    const jevResponse = JSON.parse(content);
    return NextResponse.json(jevResponse);
  } catch {
    return NextResponse.json(
      { error: 'JEV relay returned an invalid response.' },
      { status: 502 }
    );
  }
}
