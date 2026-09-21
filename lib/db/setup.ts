import { promises as fs } from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import readline from 'node:readline';

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}

async function main() {
  const postgresUrl = await question('POSTGRES_URL: ');
  const baseUrl =
    (await question('BASE_URL [http://localhost:3000]: ')) ||
    'http://localhost:3000';
  const offerkitUrl = await question('OFFERKIT_API_URL (optional for now): ');
  const offerkitKey = await question('OFFERKIT_API_KEY (optional for now): ');
  const authSecret = crypto.randomBytes(32).toString('hex');

  const env = [
    `POSTGRES_URL=${postgresUrl}`,
    `BASE_URL=${baseUrl}`,
    `AUTH_SECRET=${authSecret}`,
    `OFFERKIT_API_URL=${offerkitUrl}`,
    `OFFERKIT_API_KEY=${offerkitKey}`,
    'OFFERKIT_REDEEM_CURRENCY=CNY',
    'OFFERKIT_REDEEM_AMOUNT_MINOR=1',
    'OFFERKIT_CAMPAIGN_JEV_10=',
    'OFFERKIT_CAMPAIGN_JEV_30=',
    'OFFERKIT_CAMPAIGN_JEV_50=',
    'XIANYU_STARTER_URL=',
    'XIANYU_STANDARD_URL=',
    'XIANYU_PRO_URL=',
    '',
    '# Optional Umami web analytics.',
    'NEXT_PUBLIC_UMAMI_SCRIPT_URL=',
    'NEXT_PUBLIC_UMAMI_WEBSITE_ID=',
    '',
    '# LiteLLM relay and TypeSafe credentials are configured separately.',
    'LITELLM_PROXY_URL=http://127.0.0.1:4000',
    'LITELLM_MASTER_KEY=',
    'LITELLM_SALT_KEY=',
    'LITELLM_DATABASE_URL=',
    'TYPESAFE_API_BASE=https://api.typesafe.ai',
    'TYPESAFE_API_KEY=',
    '',
  ].join('\n');

  const envPath = path.join(process.cwd(), '.env');
  await fs.writeFile(envPath, env, { mode: 0o600 });
  // `mode` only applies when the file is created; enforce the permission when
  // setup is rerun over an existing file as well because it contains secrets.
  await fs.chmod(envPath, 0o600);
  console.log('Created .env. No Stripe setup is required for the voucher flow.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
