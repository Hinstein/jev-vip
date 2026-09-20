import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  creditTransactions,
  products,
  userCreditBalances,
} from '@/lib/db/schema';

export async function getCreditBalance(userId: number) {
  const [row] = await db
    .select({ balance: userCreditBalances.balance })
    .from(userCreditBalances)
    .where(eq(userCreditBalances.userId, userId))
    .limit(1);

  return row?.balance ?? 0;
}

export async function getCreditTransactions(userId: number, limit = 50) {
  return db
    .select({
      id: creditTransactions.id,
      type: creditTransactions.type,
      amount: creditTransactions.amount,
      source: creditTransactions.source,
      referenceId: creditTransactions.referenceId,
      providerReferenceId: creditTransactions.providerReferenceId,
      campaignId: creditTransactions.campaignId,
      voucherCodeLast4: creditTransactions.voucherCodeLast4,
      createdAt: creditTransactions.createdAt,
      productName: products.name,
    })
    .from(creditTransactions)
    .leftJoin(products, eq(creditTransactions.productId, products.id))
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function getActiveProducts() {
  return db
    .select()
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.priceMinor);
}

export async function getProductByOfferKitCampaignId(campaignId: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.offerkitCampaignId, campaignId))
    .limit(1);

  return product ?? null;
}
