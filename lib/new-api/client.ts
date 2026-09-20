import 'server-only';

import { randomUUID } from 'node:crypto';
import { getSession } from '@/lib/auth/session';
import type { NewApiUser } from './types';

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
  allow_ips?: string | null;
  cross_group_retry?: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function getBaseUrl() {
  const baseUrl = process.env.NEW_API_BASE_URL?.replace(/\/+$/, '');
  if (!baseUrl) throw new Error('New API backend is not configured');
  return baseUrl;
}

export function isNewApiConfigured() {
  return Boolean(process.env.NEW_API_BASE_URL);
}

export async function newApiRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
      payload = { success: false, message: 'Invalid New API response' };
    }
  }

  if (!response.ok || payload.success === false) {
    throw new Error(
      payload.message || `New API request failed: HTTP ${response.status}`
    );
  }

  return payload.data as T;
}

async function currentAccessToken() {
  const session = await getSession();
  if (!session) throw new Error('User is not authenticated');
  return session.accessToken;
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

async function listTokensWithAccess(accessToken: string) {
  const data = await newApiRequest<unknown>(
    accessToken,
    '/api/token/?page=1&page_size=100'
  );
  return extractItems(data);
}

export async function getNewApiSelfByAccessToken(accessToken: string) {
  return newApiRequest<NewApiUser>(accessToken, '/api/user/self');
}

export async function getNewApiSelf() {
  return getNewApiSelfByAccessToken(await currentAccessToken());
}

export async function listNewApiTokens() {
  return listTokensWithAccess(await currentAccessToken());
}

export async function createNewApiToken(name: string) {
  const accessToken = await currentAccessToken();
  const model = process.env.NEW_API_JEV_MODEL || 'jev';
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
  const temporaryName = `${name.slice(0, 39)}-${suffix}`;

  await newApiRequest<unknown>(accessToken, '/api/token/', {
    method: 'POST',
    body: JSON.stringify({
      name: temporaryName,
      expired_time: -1,
      remain_quota: 0,
      unlimited_quota: true,
      model_limits_enabled: true,
      model_limits: model,
      group: '',
    }),
  });

  const tokens = await listTokensWithAccess(accessToken);
  const created = tokens.find((token) => token.name === temporaryName);

  if (!created) {
    throw new Error('New API created the key but it could not be located');
  }

  try {
    const reveal = await newApiRequest<{ key?: string }>(
      accessToken,
      `/api/token/${created.id}/key`,
      { method: 'POST' }
    );

    if (!reveal?.key) {
      throw new Error('New API did not return the generated key');
    }

    await newApiRequest<unknown>(accessToken, '/api/token/', {
      method: 'PUT',
      body: JSON.stringify({
        id: created.id,
        name,
        expired_time: created.expired_time ?? -1,
        remain_quota: created.remain_quota ?? 0,
        unlimited_quota: true,
        model_limits_enabled: true,
        model_limits: model,
        allow_ips: created.allow_ips ?? null,
        group: created.group ?? '',
        cross_group_retry: false,
      }),
    });

    return {
      key: reveal.key,
      token: { ...created, name },
    };
  } catch (error) {
    try {
      await newApiRequest<unknown>(
        accessToken,
        `/api/token/${created.id}`,
        { method: 'DELETE' }
      );
    } catch {
      // Preserve the original error; cleanup is best effort.
    }
    throw error;
  }
}

export async function deleteNewApiToken(tokenId: number) {
  await newApiRequest<unknown>(
    await currentAccessToken(),
    `/api/token/${tokenId}`,
    { method: 'DELETE' }
  );
}

export async function redeemNewApiCode(code: string) {
  const accessToken = await currentAccessToken();
  const credited = await newApiRequest<number>(accessToken, '/api/user/topup', {
    method: 'POST',
    body: JSON.stringify({ key: code }),
  });
  const self = await getNewApiSelfByAccessToken(accessToken);
  return { credited: Number(credited || 0), self };
}
