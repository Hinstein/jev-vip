import { NextRequest, NextResponse } from 'next/server';
import {
  readJsonWithLimit,
  RequestBodyTooLargeError,
} from '@/lib/http/json';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function newApiBaseUrl() {
  const value = process.env.NEW_API_BASE_URL?.replace(/\/+$/, '');
  if (!value) throw new Error('Jev backend is not configured');
  return value;
}

function gatewayError(status: number) {
  if (status === 401) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 401 });
  }
  if (status === 402) {
    return NextResponse.json(
      { error: 'Insufficient API balance.' },
      { status: 402 }
    );
  }
  if (status === 403) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }
  if (status === 429) {
    return NextResponse.json(
      { error: 'Rate limit or API quota exceeded.' },
      { status: 429 }
    );
  }
  if (status >= 400 && status < 500) {
    return NextResponse.json({ error: 'Invalid Jev request.' }, { status: 400 });
  }
  return NextResponse.json(
    { error: 'Jev gateway is temporarily unavailable.' },
    { status: 503 }
  );
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing API key.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await readJsonWithLimit(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: 'Request body is too large.' },
        { status: 413 }
      );
    }
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
    relayResponse = await fetch(`${newApiBaseUrl()}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.NEW_API_JEV_MODEL || 'jev',
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
      { error: 'Jev gateway is temporarily unavailable.' },
      { status: 503 }
    );
  }

  const relayText = await relayResponse.text();
  if (!relayResponse.ok) {
    return gatewayError(relayResponse.status);
  }

  try {
    const relayJson = JSON.parse(relayText) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = relayJson.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('Missing relay content');

    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json(
      { error: 'Jev gateway returned an invalid response.' },
      { status: 502 }
    );
  }
}
