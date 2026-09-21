import { isLiteLLMConfigured, getLiteLLMKeyInfo } from '@/lib/litellm/client';
import { getUserById } from '@/lib/db/queries';
import { hashApiKey } from './crypto';
import { getApiKeyByHash, registerApiKey } from './queries';

function parseJevUserId(value: string | null) {
  if (!value) return null;

  const match = /^jev-user-(\d+)$/.exec(value);
  const numericMatch = /^(\d+)$/.exec(value);
  if (!match && !numericMatch) return null;

  const userId = Number((match ?? numericMatch)![1]);
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
}

export type ApiKeyResolution =
  | {
      ok: true;
      apiKey: Awaited<ReturnType<typeof registerApiKey>>;
      user: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
    }
  | { ok: false; reason: 'invalid' | 'unavailable' };

export async function resolveApiKey(
  presentedKey: string
): Promise<ApiKeyResolution> {
  const keyHash = hashApiKey(presentedKey);
  const local = await getApiKeyByHash(keyHash);

  if (local) {
    if (local.apiKey.revokedAt || local.user.deletedAt) {
      return { ok: false, reason: 'invalid' };
    }

    return { ok: true, apiKey: local.apiKey, user: local.user };
  }

  if (!isLiteLLMConfigured()) {
    return { ok: false, reason: 'unavailable' };
  }

  let remote;
  try {
    remote = await getLiteLLMKeyInfo(presentedKey);
  } catch (error) {
    console.error('Unable to validate API key with LiteLLM', error);
    return { ok: false, reason: 'unavailable' };
  }

  if (!remote) {
    return { ok: false, reason: 'invalid' };
  }

  if (remote.blocked) {
    return { ok: false, reason: 'invalid' };
  }

  const userId = parseJevUserId(remote.userId);
  if (!userId) {
    return { ok: false, reason: 'invalid' };
  }

  const user = await getUserById(userId);
  if (!user || user.deletedAt) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const apiKey = await registerApiKey({
      userId,
      // LiteLLM /key/info deliberately omits the token hash in recent
      // versions. The SHA-256 hash is the identifier accepted by /key/delete
      // and is stable for this presented key.
      providerTokenId: remote.tokenId ?? keyHash,
      keyHash,
      keyName: remote.keyName ?? 'LiteLLM key',
    });

    return { ok: true, apiKey, user };
  } catch (error) {
    console.error('Unable to persist API key ownership', error);
    return { ok: false, reason: 'unavailable' };
  }
}
