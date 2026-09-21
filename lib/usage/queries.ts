import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { usageEvents } from '@/lib/db/schema';
import { USAGE_STATUS } from './service';

export async function getUsageEventByRequestId(
  apiKeyId: number,
  requestId: string
) {
  const [event] = await db
    .select({
      status: usageEvents.status,
      credits: usageEvents.credits,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.apiKeyId, apiKeyId),
        eq(usageEvents.requestId, requestId)
      )
    )
    .limit(1);

  return event ?? null;
}

export async function getUsageSummary(userId: number) {
  const [summary] = await db
    .select({
      requests: sql<number>`count(*)`,
      inputTokens: sql<number>`coalesce(sum(${usageEvents.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${usageEvents.outputTokens}), 0)`,
      totalTokens: sql<number>`coalesce(sum(${usageEvents.totalTokens}), 0)`,
      credits: sql<number>`coalesce(sum(${usageEvents.credits}), 0)`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.status, USAGE_STATUS.COMPLETED)
      )
    );

  return {
    requests: Number(summary?.requests ?? 0),
    inputTokens: Number(summary?.inputTokens ?? 0),
    outputTokens: Number(summary?.outputTokens ?? 0),
    totalTokens: Number(summary?.totalTokens ?? 0),
    credits: Number(summary?.credits ?? 0),
  };
}

export async function getRecentUsageEvents(userId: number, limit = 50) {
  return db
    .select({
      id: usageEvents.id,
      requestId: usageEvents.requestId,
      model: usageEvents.model,
      inputTokens: usageEvents.inputTokens,
      outputTokens: usageEvents.outputTokens,
      totalTokens: usageEvents.totalTokens,
      credits: usageEvents.credits,
      status: usageEvents.status,
      createdAt: usageEvents.createdAt,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.status, USAGE_STATUS.COMPLETED)
      )
    )
    .orderBy(desc(usageEvents.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}
