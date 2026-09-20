import { client, db } from './drizzle';
import { products } from './schema';

const defaultProducts = [
  {
    name: 'Starter',
    priceMinor: 1000,
    currency: 'CNY',
    offerkitCampaignKey: 'JEV_10',
    credits: 750000,
    active: true,
  },
  {
    name: 'Standard',
    priceMinor: 3000,
    currency: 'CNY',
    offerkitCampaignKey: 'JEV_30',
    credits: 2250000,
    active: true,
  },
  {
    name: 'Pro',
    priceMinor: 5000,
    currency: 'CNY',
    offerkitCampaignKey: 'JEV_50',
    credits: 3750000,
    active: true,
  },
] as const;

async function seed() {
  for (const product of defaultProducts) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.offerkitCampaignKey,
        set: {
          name: product.name,
          priceMinor: product.priceMinor,
          currency: product.currency,
          credits: product.credits,
          active: product.active,
          updatedAt: new Date(),
        },
      });
  }

  console.log('JEV product defaults are ready.');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
