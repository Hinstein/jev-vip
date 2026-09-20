import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is required');
}

const sql = postgres(process.env.POSTGRES_URL);

const mappings = [
  {
    key: 'JEV_10',
    purchaseUrl: process.env.XIANYU_STARTER_URL,
  },
  {
    key: 'JEV_30',
    purchaseUrl: process.env.XIANYU_STANDARD_URL,
  },
  {
    key: 'JEV_50',
    purchaseUrl: process.env.XIANYU_PRO_URL,
  },
];

try {
  for (const mapping of mappings) {
    if (!mapping.purchaseUrl) {
      console.log(`Skipping ${mapping.key}: no purchase URL configured`);
      continue;
    }

    await sql`
      UPDATE products
      SET
        purchase_url = ${mapping.purchaseUrl},
        updated_at = now()
      WHERE offerkit_campaign_key = ${mapping.key}
    `;

    console.log(`Configured ${mapping.key}`);
  }
} finally {
  await sql.end();
}
