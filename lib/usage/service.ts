import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { creditTransactions, usageEvents, userCreditBalances } from '@/lib/db/schema';
import { calculateSettlementAdjustment } from './policy';

export const USAGE_STATUS = {
  RESERVED: 'RESERVED',
  COMPLETED: 'COMPLETED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  CANCELLED: 'CANCELLED',
} as const;

const RESERVATION_TTL_MS = 10 * 60 * 1000;

type UsageNumberInput = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ReserveUsageInput = {
  userId: number;
  apiKeyId: number;
  requestId: string;
  model: string;
  credits: number;
};

function assertPositiveId(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
}

export type ReserveUsageResult =
  | {
      status: 'reserved';
      usageEventId: number;
      reservedCredits: number;
      balance: number;
    }
  | {
      status: 'insufficient_credits';
      balance: number;
      credits: number;
    }
  | {
      status: 'duplicate';
      existingStatus: string;
      balance: number;
      credits: number;
    };

export type SettleUsageResult =
  | {
      status: 'completed';
      balance: number;
      credits: number;
    }
  | {
      status: 'over_budget';
      reservedCredits: number;
      actualCredits: number;
      balance: number;
    }
  | {
      status: 'not_found' | 'not_reserved';
    };

function assertNonNegativeSafeInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
}

function assertPositiveSafeInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive safe integer`);
  }
}

function validateUsageNumbers(input: UsageNumberInput) {
  assertNonNegativeSafeInteger(input.inputTokens, 'inputTokens');
  assertNonNegativeSafeInteger(input.outputTokens, 'outputTokens');
  assertPositiveSafeInteger(input.totalTokens, 'totalTokens');

  if (
    input.inputTokens > Number.MAX_SAFE_INTEGER - input.outputTokens ||
    input.totalTokens < input.inputTokens + input.outputTokens
  ) {
    throw new Error('totalTokens must include inputTokens and outputTokens');
  }
}

async function addCredits(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: number,
  amount: number
) {
  assertPositiveSafeInteger(amount, 'amount');
  const updatedAt = new Date();

  await tx
    .insert(userCreditBalances)
    .values({ userId, balance: amount, updatedAt })
    .onConflictDoUpdate({
      target: userCreditBalances.userId,
      set: {
        balance: sql`${userCreditBalances.balance} + ${amount}`,
        updatedAt,
      },
    });
}

async function releaseExpiredReservations(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: number
) {
  const cutoff = new Date(Date.now() - RESERVATION_TTL_MS);
  const expired = await tx
    .update(usageEvents)
    .set({ status: USAGE_STATUS.CANCELLED })
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.status, USAGE_STATUS.RESERVED),
        lt(usageEvents.createdAt, cutoff)
      )
    )
    .returning({ id: usageEvents.id, credits: usageEvents.credits });

  for (const reservation of expired) {
    if (reservation.credits > 0) {
      await addCredits(tx, userId, reservation.credits);
    }
  }
}

export async function reserveUsageCredits(
  input: ReserveUsageInput
): Promise<ReserveUsageResult> {
  assertPositiveId(input.userId, 'userId');
  assertPositiveId(input.apiKeyId, 'apiKeyId');
  assertPositiveSafeInteger(input.credits, 'credits');

  if (!input.requestId || input.requestId.length > 128) {
    throw new Error('Invalid request id');
  }

  if (!/^[\x21-\x7e]+$/.test(input.requestId)) {
    throw new Error('Invalid request id');
  }

  if (!input.model || input.model.length > 100) {
    throw new Error('Invalid model');
  }

  return db.transaction(async (tx) => {
    await releaseExpiredReservations(tx, input.userId);

    const [inserted] = await tx
      .insert(usageEvents)
      .values({
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        requestId: input.requestId,
        model: input.model,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        credits: input.credits,
        status: USAGE_STATUS.RESERVED,
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
        existingStatus: existing?.status ?? 'UNKNOWN',
        balance: current?.balance ?? 0,
        credits: existing?.credits ?? input.credits,
      };
    }

    const [balance] = await tx
      .update(userCreditBalances)
      .set({
        balance: sql`${userCreditBalances.balance} - ${input.credits}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userCreditBalances.userId, input.userId),
          gte(userCreditBalances.balance, input.credits)
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
        .set({ status: USAGE_STATUS.INSUFFICIENT_CREDITS })
        .where(eq(usageEvents.id, inserted.id));

      return {
        status: 'insufficient_credits',
        balance: current?.balance ?? 0,
        credits: input.credits,
      };
    }

    return {
      status: 'reserved',
      usageEventId: inserted.id,
      reservedCredits: input.credits,
      balance: balance.balance,
    };
  });
}

export async function releaseUsageReservation(usageEventId: number) {
  assertPositiveId(usageEventId, 'usageEventId');

  return db.transaction(async (tx) => {
    const [reservation] = await tx
      .update(usageEvents)
      .set({ status: USAGE_STATUS.CANCELLED })
      .where(
        and(
          eq(usageEvents.id, usageEventId),
          eq(usageEvents.status, USAGE_STATUS.RESERVED)
        )
      )
      .returning({ userId: usageEvents.userId, credits: usageEvents.credits });

    if (!reservation) return false;

    if (reservation.credits > 0) {
      await addCredits(tx, reservation.userId, reservation.credits);
    }
    return true;
  });
}

export async function settleUsageReservation(input: {
  usageEventId: number;
  requestId: string;
  userId: number;
  apiKeyId: number;
  model: string;
} & UsageNumberInput): Promise<SettleUsageResult> {
  assertPositiveId(input.usageEventId, 'usageEventId');
  assertPositiveId(input.userId, 'userId');
  assertPositiveId(input.apiKeyId, 'apiKeyId');
  if (!input.requestId || input.requestId.length > 128) {
    throw new Error('Invalid request id');
  }
  if (!/^[\x21-\x7e]+$/.test(input.requestId)) {
    throw new Error('Invalid request id');
  }
  if (!input.model || input.model.length > 100) {
    throw new Error('Invalid model');
  }
  validateUsageNumbers(input);

  return db.transaction(async (tx) => {
    const [reservation] = await tx
      .select({
        userId: usageEvents.userId,
        apiKeyId: usageEvents.apiKeyId,
        requestId: usageEvents.requestId,
        credits: usageEvents.credits,
        status: usageEvents.status,
      })
      .from(usageEvents)
      .where(eq(usageEvents.id, input.usageEventId))
      .for('update')
      .limit(1);

    if (!reservation) return { status: 'not_found' };
    if (
      reservation.status !== USAGE_STATUS.RESERVED ||
      reservation.userId !== input.userId ||
      reservation.apiKeyId !== input.apiKeyId ||
      reservation.requestId !== input.requestId
    ) {
      return { status: 'not_reserved' };
    }

    const { additionalDebit: additionalCredits, refund } =
      calculateSettlementAdjustment(reservation.credits, input.totalTokens);

    if (additionalCredits > 0) {
      const [balanceAfterAdditionalDebit] = await tx
        .update(userCreditBalances)
        .set({
          balance: sql`${userCreditBalances.balance} - ${additionalCredits}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userCreditBalances.userId, reservation.userId),
            gte(userCreditBalances.balance, additionalCredits)
          )
        )
        .returning({ balance: userCreditBalances.balance });

      if (!balanceAfterAdditionalDebit) {
        await addCredits(tx, reservation.userId, reservation.credits);
        await tx
          .update(usageEvents)
          .set({ status: USAGE_STATUS.INSUFFICIENT_CREDITS })
          .where(eq(usageEvents.id, input.usageEventId));
        const [current] = await tx
          .select({ balance: userCreditBalances.balance })
          .from(userCreditBalances)
          .where(eq(userCreditBalances.userId, reservation.userId))
          .limit(1);

        return {
          status: 'over_budget',
          reservedCredits: reservation.credits,
          actualCredits: input.totalTokens,
          balance: current?.balance ?? 0,
        };
      }
    }

    if (refund > 0) {
      await addCredits(tx, reservation.userId, refund);
    }

    const [updated] = await tx
      .update(usageEvents)
      .set({
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
        credits: input.totalTokens,
        status: USAGE_STATUS.COMPLETED,
      })
      .where(
        and(
          eq(usageEvents.id, input.usageEventId),
          eq(usageEvents.status, USAGE_STATUS.RESERVED)
        )
      )
      .returning({ id: usageEvents.id });

    if (!updated) {
      throw new Error('Usage reservation was lost during settlement');
    }

    await tx.insert(creditTransactions).values({
      userId: input.userId,
      type: 'USAGE',
      amount: -input.totalTokens,
      source: 'LITELLM',
      referenceId: `usage:${input.apiKeyId}:${input.requestId}`,
    });

    const [balance] = await tx
      .select({ balance: userCreditBalances.balance })
      .from(userCreditBalances)
      .where(eq(userCreditBalances.userId, input.userId))
      .limit(1);

    return {
      status: 'completed',
      balance: balance?.balance ?? 0,
      credits: input.totalTokens,
    };
  });
}
