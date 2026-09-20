import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { creditTransactions, usageEvents, userCreditBalances } from '@/lib/db/schema';

const COMPLETED = 'COMPLETED';
const INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS';

export type RecordUsageInput = {
  userId: number;
  apiKeyId: number;
  requestId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type RecordUsageResult =
  | {
      status: 'completed';
      balance: number;
      credits: number;
    }
  | {
      status: 'insufficient_credits';
      balance: number;
      credits: number;
    }
  | {
      status: 'duplicate';
      balance: number;
      credits: number;
    };

function assertUsageNumber(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

export async function recordUsageAndDebit(
  input: RecordUsageInput
): Promise<RecordUsageResult> {
  assertUsageNumber(input.inputTokens, 'inputTokens');
  assertUsageNumber(input.outputTokens, 'outputTokens');
  assertUsageNumber(input.totalTokens, 'totalTokens');

  if (input.totalTokens <= 0) {
    throw new Error('totalTokens must be greater than zero');
  }

  if (!input.requestId || input.requestId.length > 128) {
    throw new Error('Invalid request id');
  }

  if (!input.model || input.model.length > 100) {
    throw new Error('Invalid model');
  }

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(usageEvents)
      .values({
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        requestId: input.requestId,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
        credits: input.totalTokens,
        status: 'PENDING',
      })
      .onConflictDoNothing({
        target: [usageEvents.apiKeyId, usageEvents.requestId],
      })
      .returning({ id: usageEvents.id });

    if (!inserted) {
      const [existing] = await tx
        .select({
          status: usageEvents.status,
          credits: usageEvents.credits,
        })
        .from(usageEvents)
        .where(
          and(
            eq(usageEvents.apiKeyId, input.apiKeyId),
            eq(usageEvents.requestId, input.requestId)
          )
        )
        .limit(1);

      const [current] = await tx
        .select({ balance: userCreditBalances.balance })
        .from(userCreditBalances)
        .where(eq(userCreditBalances.userId, input.userId))
        .limit(1);

      return {
        status: 'duplicate',
        balance: current?.balance ?? 0,
        credits: existing?.credits ?? input.totalTokens,
      };
    }

    const [balance] = await tx
      .update(userCreditBalances)
      .set({
        balance: sql`${userCreditBalances.balance} - ${input.totalTokens}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userCreditBalances.userId, input.userId),
          gte(userCreditBalances.balance, input.totalTokens)
        )
      )
      .returning({ balance: userCreditBalances.balance });

    if (!balance) {
      const [current] = await tx
        .select({ balance: userCreditBalances.balance })
        .from(userCreditBalances)
        .where(eq(userCreditBalances.userId, input.userId))
        .limit(1);

      await tx
        .update(usageEvents)
        .set({ status: INSUFFICIENT_CREDITS })
        .where(eq(usageEvents.id, inserted.id));

      return {
        status: 'insufficient_credits',
        balance: current?.balance ?? 0,
        credits: input.totalTokens,
      };
    }

    await tx.insert(creditTransactions).values({
      userId: input.userId,
      type: 'USAGE',
      amount: -input.totalTokens,
      source: 'LITELLM',
      referenceId: `usage:${input.apiKeyId}:${input.requestId}`,
    });

    await tx
      .update(usageEvents)
      .set({ status: COMPLETED })
      .where(eq(usageEvents.id, inserted.id));

    return {
      status: 'completed',
      balance: balance.balance,
      credits: input.totalTokens,
    };
  });
}
