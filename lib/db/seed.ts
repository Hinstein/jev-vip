import { client, db } from './drizzle';
import { products } from './schema';

const defaultProducts = [
  {
    name: 'Starter',
    priceMinor: 1000,
    currency: 'CNY',
    offerkitCampaignKey: 'JEV_10',
    credits: 1000000,
    active: true,
  },
  {
    name: 'Standard',
    priceMinor: 3000,
    currency: 'CNY',
    offerkitCampaignKey: 'JEV_30',
    credits: 3500000,
    active: true,
  },
  {
    name: 'Pro',
    priceMinor: 5000,
    currency: 'CNY',
    offerkitCampaignKey: 'JEV_50',
    credits: 6000000,
    active: true,
  },
] as const;

async function seed() {
  for (const product of defaultProducts) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoNothing({ target: products.offerkitCampaignKey });
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
