import 'server-only';
import { hashApiKey } from '@/lib/api-keys/crypto';
import { isLiteLLMConfigured } from './config';

export { isLiteLLMConfigured } from './config';

export type LiteLLMVirtualKey = {
  tokenId: string;
  keyName: string;
  keyAlias: string | null;
  createdAt: string | null;
  spend: number;
  blocked: boolean;
  models: string[];
};

export type LiteLLMKeyInfo = {
  tokenId: string | null;
  userId: string | null;
  keyName: string | null;
  keyAlias: string | null;
  blocked: boolean;
};

type LiteLLMKeyRecord = {
  token?: unknown;
  token_id?: unknown;
  key_name?: unknown;
  key_alias?: unknown;
  created_at?: unknown;
  spend?: unknown;
  blocked?: unknown;
  models?: unknown;
  user_id?: unknown;
  metadata?: unknown;
};

const KEY_LIST_PAGE_SIZE = 100;
const MAX_KEY_LIST_PAGES = 100;

class LiteLLMAdminError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'LiteLLMAdminError';
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(record: Record<string, unknown> | null, key: string) {
  if (typeof record?.[key] === 'string') return record[key] as string;
  if (typeof record?.[key] === 'number' && Number.isSafeInteger(record[key])) {
    return String(record[key]);
  }
  return null;
}

function safeTokenIdentifier(value: string | null) {
  if (!value) return null;

  // LiteLLM's current `token`/`token_id` values are SHA-256 hashes. Keep a
  // defensive fallback for older or custom responses that may still contain
  // the reusable `sk-...` secret so it can never leave the server.
  return value.startsWith('sk-') ? hashApiKey(value) : value;
}

function tokenIdentifier(record: Record<string, unknown> | null) {
  return safeTokenIdentifier(
    stringValue(record, 'token_id') ?? stringValue(record, 'token')
  );
}

function providerTokenId(record: Record<string, unknown> | null) {
  return safeTokenIdentifier(
    stringValue(record, 'token_id') ?? stringValue(record, 'token')
  );
}

function ownerIdentifier(record: Record<string, unknown> | null) {
  const metadata = asRecord(record?.metadata);
  return (
    stringValue(record, 'user_id') ?? stringValue(metadata, 'jev_user_id')
  );
}

function getConfig() {
  const baseUrl = process.env.LITELLM_PROXY_URL?.trim().replace(/\/+$/, '');
  const masterKey = process.env.LITELLM_MASTER_KEY?.trim();

  if (!baseUrl || !masterKey || !isLiteLLMConfigured()) {
    throw new Error('LiteLLM relay is not configured');
  }

  return { baseUrl, masterKey };
}

function userRef(userId: number) {
  return `jev-user-${userId}`;
}

async function adminRequest(path: string, init?: RequestInit) {
  const { baseUrl, masterKey } = getConfig();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${masterKey}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error('LiteLLM relay is unavailable');
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload
        ? JSON.stringify((payload as Record<string, unknown>).error)
        : `HTTP ${response.status}`;

    throw new LiteLLMAdminError(
      `LiteLLM admin request failed: ${message}`,
      response.status
    );
  }

  return payload;
}

export async function createLiteLLMVirtualKey(
  userId: number,
  keyAlias: string
) {
  const payload = (await adminRequest('/key/generate', {
    method: 'POST',
    body: JSON.stringify({
      models: ['jev'],
      user_id: userRef(userId),
      key_alias: keyAlias,
      metadata: {
        product: 'jev-vip',
        jev_user_id: String(userId),
      },
    }),
  })) as Record<string, unknown>;

  const key = typeof payload.key === 'string' ? payload.key : null;
  if (!key) {
    throw new Error('LiteLLM did not return the generated key');
  }

  const tokenId = providerTokenId(payload);

  return {
    key,
    tokenId,
    keyName:
      typeof payload.key_name === 'string' ? payload.key_name : 'sk-...hidden',
  };
}

export async function listLiteLLMVirtualKeys(
  userId: number
): Promise<LiteLLMVirtualKey[]> {
  const expectedUserId = userRef(userId);
  const result: LiteLLMVirtualKey[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_KEY_LIST_PAGES; page += 1) {
    const params = new URLSearchParams({
      user_id: expectedUserId,
      return_full_object: 'true',
      page: String(page),
      size: String(KEY_LIST_PAGE_SIZE),
    });

    const payload = asRecord(
      await adminRequest(`/key/list?${params.toString()}`)
    );
    const keys = Array.isArray(payload?.keys)
      ? (payload.keys as unknown[])
      : [];

    for (const item of keys) {
      // Do not infer ownership from a bare string. Older LiteLLM responses
      // used to return raw keys, but a misbehaving/older proxy could ignore
      // the user_id filter and expose another user's key here. Current
      // versions return full objects when return_full_object=true.
      const record = asRecord(item) as LiteLLMKeyRecord | null;
      if (!record || ownerIdentifier(record) !== expectedUserId) continue;

      const tokenId = tokenIdentifier(record);
      if (!tokenId || seen.has(tokenId)) continue;
      seen.add(tokenId);
      result.push({
        tokenId,
        keyName:
          typeof record.key_name === 'string'
            ? record.key_name
            : 'sk-...hidden',
        keyAlias:
          typeof record.key_alias === 'string' ? record.key_alias : null,
        createdAt:
          typeof record.created_at === 'string' ? record.created_at : null,
        spend: typeof record.spend === 'number' ? record.spend : 0,
        blocked: record.blocked === true,
        models: Array.isArray(record.models)
          ? record.models.filter(
              (model): model is string => typeof model === 'string'
            )
          : [],
      });
    }

    const totalPages =
      typeof payload?.total_pages === 'number' &&
      Number.isSafeInteger(payload.total_pages)
        ? payload.total_pages
        : null;
    if (
      keys.length < KEY_LIST_PAGE_SIZE ||
      (totalPages !== null && page >= totalPages)
    ) {
      break;
    }
  }

  return result;
}

export async function deleteLiteLLMVirtualKey(
  userId: number,
  tokenId: string
) {
  const keys = await listLiteLLMVirtualKeys(userId);
  const owned = keys.some((key) => key.tokenId === tokenId);

  if (!owned) {
    return false;
  }

  await adminRequest('/key/delete', {
    method: 'POST',
    body: JSON.stringify({ keys: [tokenId] }),
  });
  return true;
}

export async function deleteLiteLLMKeyBySecret(key: string) {
  await adminRequest('/key/delete', {
    method: 'POST',
    body: JSON.stringify({ keys: [key] }),
  });
}

export async function getLiteLLMKeyInfo(
  presentedKey: string
): Promise<LiteLLMKeyInfo | null> {
  let payload: unknown;
  try {
    // LiteLLM accepts either a raw key or its SHA-256 hash, but the raw key
    // would be written to proxy/access logs when sent as a query parameter.
    payload = await adminRequest(
      `/key/info?key=${encodeURIComponent(hashApiKey(presentedKey))}`
    );
  } catch (error) {
    if (error instanceof LiteLLMAdminError && error.status === 404) {
      return null;
    }
    throw error;
  }

  const root = asRecord(payload);
  const info = asRecord(root?.info) ?? root;
  if (!info) return null;

  const metadata = asRecord(info.metadata);
  const userId =
    stringValue(info, 'user_id') ?? stringValue(metadata, 'jev_user_id');
  const tokenId = providerTokenId(info);

  return {
    tokenId,
    userId,
    keyName: stringValue(info, 'key_name'),
    keyAlias: stringValue(info, 'key_alias'),
    blocked: info.blocked === true,
  };
}
