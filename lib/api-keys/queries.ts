import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { apiKeys, users } from '@/lib/db/schema';

export async function getApiKeyByHash(keyHash: string) {
  const [result] = await db
    .select({ apiKey: apiKeys, user: users })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  return result ?? null;
}

export async function registerApiKey(input: {
  userId: number;
  providerTokenId: string | null;
  keyHash: string;
  keyName: string;
}) {
  const [inserted] = await db
    .insert(apiKeys)
    .values(input)
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const existing = await getApiKeyByHash(input.keyHash);
  if (!existing || existing.apiKey.userId !== input.userId) {
    throw new Error('API key could not be registered');
  }

  return existing.apiKey;
}

export async function revokeApiKeyForUser(
  userId: number,
  providerTokenId: string
) {
  const [revoked] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.providerTokenId, providerTokenId),
        isNull(apiKeys.revokedAt)
      )
    )
    .returning({ id: apiKeys.id });

  return Boolean(revoked);
}

export async function getActiveApiKeyCount(userId: number) {
  const [result] = await db
    .select({ count: count(apiKeys.id) })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));

  return Number(result?.count ?? 0);
}

export async function listLocalApiKeys(userId: number) {
  return db
    .select({
      id: apiKeys.id,
      providerTokenId: apiKeys.providerTokenId,
      keyName: apiKeys.keyName,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
    .orderBy(desc(apiKeys.createdAt));
}
