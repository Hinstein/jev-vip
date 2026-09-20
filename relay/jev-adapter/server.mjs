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

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST' || req.url !== '/v1/chat/completions') {
    return sendJson(res, 404, { error: { message: 'Not found' } });
  }

  if (!authorized(req)) {
    return sendJson(res, 401, { error: { message: 'Unauthorized adapter request' } });
  }

  if (!upstreamKey) {
    return sendJson(res, 500, { error: { message: 'TypeSafe upstream key is not configured' } });
  }

  try {
    const body = await readJson(req);
    const payload = extractJevPayload(body);

    const upstream = await fetch(`${upstreamBase}/v1/systemone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${upstreamKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const text = await upstream.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return sendJson(res, 502, { error: { message: 'Upstream returned invalid JSON' } });
    }

    if (!upstream.ok) {
      return sendJson(res, upstream.status, {
        error: {
          message:
            typeof data?.message === 'string'
              ? data.message
              : typeof data?.error === 'string'
                ? data.error
                : 'TypeSafe upstream request failed',
        },
      });
    }

    const usage = data?.usage && typeof data.usage === 'object' ? data.usage : {};
    const promptTokens = Number(usage.input_tokens || 0);
    const completionTokens = Number(usage.output_tokens || 0);

    return sendJson(res, 200, {
      id: `jev-${randomUUID()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: typeof data?.model === 'string' ? data.model : 'jev',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: JSON.stringify(data),
          },
        },
      ],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'body_too_large'
        ? 'Request body is too large'
        : 'Invalid JEV request payload';
    return sendJson(res, error instanceof Error && error.message === 'body_too_large' ? 413 : 400, {
      error: { message },
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`JEV adapter listening on :${port}`);
});
