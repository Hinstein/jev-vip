import 'server-only';

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
  token_id?: unknown;
  key_name?: unknown;
  key_alias?: unknown;
  created_at?: unknown;
  spend?: unknown;
  blocked?: unknown;
  models?: unknown;
  user_id?: unknown;
};

class LiteLLMAdminError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'LiteLLMAdminError';
  }
}

function getConfig() {
  const baseUrl = process.env.LITELLM_PROXY_URL?.replace(/\/+$/, '');
  const masterKey = process.env.LITELLM_MASTER_KEY;

  if (!baseUrl || !masterKey) {
    throw new Error('LiteLLM relay is not configured');
  }

  return { baseUrl, masterKey };
}

export function isLiteLLMConfigured() {
  return Boolean(
    process.env.LITELLM_PROXY_URL && process.env.LITELLM_MASTER_KEY
  );
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

  const tokenId =
    typeof payload.token_id === 'string' ? payload.token_id : null;

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
  const params = new URLSearchParams({
    user_id: expectedUserId,
    return_full_object: 'true',
    page: '1',
    size: '100',
  });

  const payload = (await adminRequest(
    `/key/list?${params.toString()}`
  )) as Record<string, unknown>;

  const keys = Array.isArray(payload.keys)
    ? (payload.keys as LiteLLMKeyRecord[])
    : [];

  return keys
    .filter((item) => String(item.user_id ?? '') === expectedUserId)
    .map((item) => {
      const tokenId =
        typeof item.token_id === 'string'
          ? item.token_id
          : '';

      return {
        tokenId,
        keyName:
          typeof item.key_name === 'string' ? item.key_name : 'sk-...hidden',
        keyAlias:
          typeof item.key_alias === 'string' ? item.key_alias : null,
        createdAt:
          typeof item.created_at === 'string' ? item.created_at : null,
        spend: typeof item.spend === 'number' ? item.spend : 0,
        blocked: item.blocked === true,
        models: Array.isArray(item.models)
          ? item.models.filter(
              (model): model is string => typeof model === 'string'
            )
          : [],
      };
    })
    .filter((item) => item.tokenId.length > 0);
}

export async function deleteLiteLLMVirtualKey(
  userId: number,
  tokenId: string
) {
  const keys = await listLiteLLMVirtualKeys(userId);
  const owned = keys.some((key) => key.tokenId === tokenId);

  if (!owned) {
    throw new Error('API key was not found for this user');
  }

  await adminRequest('/key/delete', {
    method: 'POST',
    body: JSON.stringify({ keys: [tokenId] }),
  });
}

export async function deleteLiteLLMKeyBySecret(key: string) {
  await adminRequest('/key/delete', {
    method: 'POST',
    body: JSON.stringify({ keys: [key] }),
  });
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

export async function getLiteLLMKeyInfo(
  presentedKey: string
): Promise<LiteLLMKeyInfo | null> {
  let payload: unknown;
  try {
    payload = await adminRequest(
      `/key/info?key=${encodeURIComponent(presentedKey)}`
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
  const tokenId =
    stringValue(info, 'token_id');

  return {
    tokenId,
    userId,
    keyName: stringValue(info, 'key_name'),
    keyAlias: stringValue(info, 'key_alias'),
    blocked: info.blocked === true,
  };
}
