import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  creditTransactions,
  userCreditBalances,
  type NewCreditTransaction,
} from '@/lib/db/schema';

type ApplyCreditTransactionInput = Omit<
  NewCreditTransaction,
  'id' | 'createdAt'
> & {
  amount: number;
};

export async function applyCreditTransaction(
  input: ApplyCreditTransactionInput
) {
  if (!Number.isSafeInteger(input.amount) || input.amount === 0) {
    throw new Error('Credit amount must be a non-zero safe integer');
  }

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(creditTransactions)
      .values(input)
      .onConflictDoNothing({ target: creditTransactions.referenceId })
      .returning({ id: creditTransactions.id });

    if (!inserted) {
      const [current] = await tx
        .select({ balance: userCreditBalances.balance })
        .from(userCreditBalances)
        .where(eq(userCreditBalances.userId, input.userId))
        .limit(1);

      return {
        applied: false,
        balance: current?.balance ?? 0,
      };
    }

    const updatedAt = new Date();

    if (input.amount > 0) {
      const [balance] = await tx
        .insert(userCreditBalances)
        .values({
          userId: input.userId,
          balance: input.amount,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: userCreditBalances.userId,
          set: {
            balance: sql`${userCreditBalances.balance} + ${input.amount}`,
            updatedAt,
          },
        })
        .returning({ balance: userCreditBalances.balance });

      return {
        applied: true,
        balance: balance.balance,
      };
    }

    const [balance] = await tx
      .update(userCreditBalances)
      .set({
        balance: sql`${userCreditBalances.balance} + ${input.amount}`,
        updatedAt,
      })
      .where(
        and(
          eq(userCreditBalances.userId, input.userId),
          gte(userCreditBalances.balance, Math.abs(input.amount))
        )
      )
      .returning({ balance: userCreditBalances.balance });

    if (!balance) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    return {
      applied: true,
      balance: balance.balance,
    };
  });
}
