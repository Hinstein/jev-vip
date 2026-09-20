import 'server-only';

import { createHmac } from 'node:crypto';

type LocalUser = {
  id: number;
  email: string;
  name?: string | null;
};

export type NewApiSelf = {
  id: number;
  username: string;
  display_name?: string;
  role: number;
  status: number;
  group: string;
  quota: number;
  used_quota: number;
  request_count: number;
};

export type NewApiToken = {
  id: number;
  name: string;
  key: string;
  status: number;
  created_time: number;
  accessed_time?: number;
  expired_time: number;
  remain_quota: number;
  used_quota: number;
  unlimited_quota: boolean;
  model_limits_enabled?: boolean;
  model_limits?: string;
  group?: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type LoginData = {
  access_token?: string;
  access_expires_at?: number;
  user?: NewApiSelf;
};

const authCache = new Map<
  number,
  { accessToken: string; expiresAt: number }
>();

function getConfig() {
  const baseUrl = process.env.NEW_API_BASE_URL?.replace(/\/+$/, '');
  const identitySecret =
    process.env.NEW_API_IDENTITY_SECRET || process.env.AUTH_SECRET;

  if (!baseUrl || !identitySecret) {
    throw new Error('New API backend is not configured');
  }

  return { baseUrl, identitySecret };
}

export function isNewApiConfigured() {
  return Boolean(
    process.env.NEW_API_BASE_URL &&
      (process.env.NEW_API_IDENTITY_SECRET || process.env.AUTH_SECRET)
  );
}

function backendUsername(user: LocalUser) {
  return `zev_${user.id}`;
}

function backendPassword(user: LocalUser) {
  const { identitySecret } = getConfig();
  return createHmac('sha256', identitySecret)
    .update(`new-api-user:${user.id}`)
    .digest('hex');
}

async function rawRequest<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; payload: ApiEnvelope<T> }> {
  const { baseUrl } = getConfig();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('New API backend is unavailable');
  }

  const text = await response.text();
  let payload: ApiEnvelope<T> = {};

  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      payload = { success: false, message: text.slice(0, 500) };
    }
  }

  return { ok: response.ok, status: response.status, payload };
}

async function login(user: LocalUser) {
  const result = await rawRequest<LoginData>('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({
      username: backendUsername(user),
      password: backendPassword(user),
    }),
  });

  const accessToken = result.payload.data?.access_token;
  if (result.ok && result.payload.success !== false && accessToken) {
    const expiresAt =
      typeof result.payload.data?.access_expires_at === 'number'
        ? result.payload.data.access_expires_at
        : Math.floor(Date.now() / 1000) + 30 * 60;

    authCache.set(user.id, { accessToken, expiresAt });
    return accessToken;
  }

  return null;
}

async function register(user: LocalUser) {
  const result = await rawRequest<unknown>('/api/user/register', {
    method: 'POST',
    body: JSON.stringify({
      username: backendUsername(user),
      password: backendPassword(user),
    }),
  });

  if (!result.ok || result.payload.success === false) {
    throw new Error(
      result.payload.message ||
        'Unable to provision the user in the New API backend'
    );
  }
}

async function getAccessToken(user: LocalUser) {
  const cached = authCache.get(user.id);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 60 > now) {
    return cached.accessToken;
  }

  let token = await login(user);
  if (token) return token;

  await register(user);
  token = await login(user);

  if (!token) {
    throw new Error(
      'New API login did not return an access token. Disable backend 2FA/login challenges for ZEV service users.'
    );
  }

  return token;
}

async function userRequest<T>(
  user: LocalUser,
  path: string,
  init?: RequestInit
): Promise<T> {
  const accessToken = await getAccessToken(user);
  const result = await rawRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok || result.payload.success === false) {
    throw new Error(
      result.payload.message || `New API request failed: HTTP ${result.status}`
    );
  }

  return result.payload.data as T;
}

function extractItems(payload: unknown): NewApiToken[] {
  if (Array.isArray(payload)) return payload as NewApiToken[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of ['items', 'data', 'tokens']) {
    if (Array.isArray(record[key])) {
      return record[key] as NewApiToken[];
    }
  }
  return [];
}

export async function getNewApiSelf(user: LocalUser) {
  return userRequest<NewApiSelf>(user, '/api/user/self');
}

export async function listNewApiTokens(user: LocalUser) {
  const data = await userRequest<unknown>(user, '/api/token/?page=1&page_size=100');
  return extractItems(data);
}

export async function createNewApiToken(user: LocalUser, name: string) {
  await userRequest<unknown>(user, '/api/token/', {
    method: 'POST',
    body: JSON.stringify({
      name,
      expired_time: -1,
      remain_quota: 0,
      unlimited_quota: true,
      model_limits_enabled: true,
      model_limits: process.env.NEW_API_JEV_MODEL || 'jev',
      group: 'default',
    }),
  });

  const tokens = await listNewApiTokens(user);
  const created = [...tokens]
    .filter((token) => token.name === name)
    .sort((a, b) => b.id - a.id)[0];

  if (!created) {
    throw new Error('New API created the key but it could not be located');
  }

  const reveal = await userRequest<{ key?: string }>(
    user,
    `/api/token/${created.id}/key`,
    { method: 'POST' }
  );

  if (!reveal?.key) {
    throw new Error('New API did not return the generated key');
  }

  return {
    key: reveal.key,
    token: created,
  };
}

export async function deleteNewApiToken(user: LocalUser, tokenId: number) {
  await userRequest<unknown>(user, `/api/token/${tokenId}`, {
    method: 'DELETE',
  });
}

export async function redeemNewApiCode(user: LocalUser, code: string) {
  const credited = await userRequest<number>(user, '/api/user/topup', {
    method: 'POST',
    body: JSON.stringify({ key: code }),
  });
  const self = await getNewApiSelf(user);
  return { credited: Number(credited || 0), self };
}
