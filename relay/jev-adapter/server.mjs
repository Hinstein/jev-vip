import http from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.PORT || 4100);
const upstreamBase = (process.env.TYPESAFE_API_BASE || 'https://api.typesafe.ai').replace(/\/+$/, '');
const upstreamKey = process.env.TYPESAFE_API_KEY;
const sharedKey = process.env.JEV_ADAPTER_SHARED_KEY;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function authorized(req) {
  if (!sharedKey) return false;
  return req.headers.authorization === `Bearer ${sharedKey}`;
}

function extractJevPayload(body) {
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const last = messages[messages.length - 1];
  if (!last || typeof last.content !== 'string') {
    throw new Error('invalid_messages');
  }
  const payload = JSON.parse(last.content);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('invalid_payload');
  }
  return payload;
}

function normalizeUpstreamResult(data) {
  const usage = data?.usage;
  const inputTokens = Number(usage?.input_tokens);
  const outputTokens = Number(usage?.output_tokens ?? 0);

  if (
    !Number.isSafeInteger(inputTokens) ||
    inputTokens < 0 ||
    !Number.isSafeInteger(outputTokens) ||
    outputTokens < 0
  ) {
    throw new Error('invalid_usage');
  }

  if (!data?.answers || typeof data.answers !== 'object' || Array.isArray(data.answers)) {
    throw new Error('invalid_answers');
  }

  return {
    model: typeof data.model === 'string' ? data.model : 'jev',
    answers: data.answers,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  };
}

function upstreamFailureStatus(status) {
  if (status === 400 || status === 422) return 400;
  if (status === 408 || status === 429) return 503;
  return 502;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    if (!upstreamKey || !sharedKey) {
      return sendJson(res, 503, { ok: false });
    }
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    return sendJson(res, 404, { error: { message: 'Not found' } });
  }

  if (!authorized(req)) {
    return sendJson(res, 401, { error: { message: 'Unauthorized adapter request' } });
  }

  if (!upstreamKey) {
    return sendJson(res, 503, {
      error: { message: 'Jev upstream is not configured' },
    });
  }

  try {
    const body = await readJson(req);
    const payload = extractJevPayload(body);

    let upstream;
    let text;
    try {
      upstream = await fetch(`${upstreamBase}/v1/systemone`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstreamKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      text = await upstream.text();
    } catch (error) {
      console.error('TypeSafe transport failed', {
        message: error instanceof Error ? error.message : 'unknown error',
      });
      return sendJson(res, 502, {
        error: { message: 'Jev upstream is temporarily unavailable' },
      });
    }

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return sendJson(res, 502, {
        error: { message: 'Jev upstream returned an invalid response' },
      });
    }

    if (!upstream.ok) {
      console.error('TypeSafe request failed', {
        status: upstream.status,
        requestId: upstream.headers.get('x-request-id') || undefined,
      });
      return sendJson(res, upstreamFailureStatus(upstream.status), {
        error: {
          message:
            upstream.status === 400 || upstream.status === 422
              ? 'Invalid Jev request'
              : 'Jev upstream is temporarily unavailable',
        },
      });
    }

    let result;
    try {
      result = normalizeUpstreamResult(data);
    } catch {
      return sendJson(res, 502, {
        error: { message: 'Jev upstream returned an invalid response' },
      });
    }

    return sendJson(res, 200, {
      id: `jev-${randomUUID()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: JSON.stringify(result),
          },
        },
      ],
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens:
          result.usage.input_tokens + result.usage.output_tokens,
      },
    });
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'body_too_large';
    return sendJson(res, tooLarge ? 413 : 400, {
      error: {
        message: tooLarge
          ? 'Request body is too large'
          : 'Invalid JEV request payload',
      },
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`JEV adapter listening on :${port}`);
});
