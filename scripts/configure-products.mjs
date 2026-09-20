import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is required');
}

const sql = postgres(process.env.POSTGRES_URL);

const mappings = [
  {
    key: 'JEV_10',
    campaignId: process.env.OFFERKIT_CAMPAIGN_JEV_10,
    purchaseUrl: process.env.XIANYU_STARTER_URL,
  },
  {
    key: 'JEV_30',
    campaignId: process.env.OFFERKIT_CAMPAIGN_JEV_30,
    purchaseUrl: process.env.XIANYU_STANDARD_URL,
  },
  {
    key: 'JEV_50',
    campaignId: process.env.OFFERKIT_CAMPAIGN_JEV_50,
    purchaseUrl: process.env.XIANYU_PRO_URL,
  },
];

try {
  for (const mapping of mappings) {
    if (!mapping.campaignId && !mapping.purchaseUrl) {
      console.log(`Skipping ${mapping.key}: no values configured`);
      continue;
    }

    await sql`
      UPDATE products
      SET
        offerkit_campaign_id = COALESCE(${mapping.campaignId ?? null}, offerkit_campaign_id),
        purchase_url = COALESCE(${mapping.purchaseUrl ?? null}, purchase_url),
        updated_at = now()
      WHERE offerkit_campaign_key = ${mapping.key}
    `;

    console.log(`Configured ${mapping.key}`);
  }
} finally {
  await sql.end();
}
