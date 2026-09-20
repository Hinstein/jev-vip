import { existsSync, readFileSync } from 'node:fs';

const forbiddenPaths = [
  'lib/db',
  'lib/credits',
  'lib/litellm',
  'lib/vouchers',
  'relay/litellm',
  'docker-compose.relay.yml',
];

for (const path of forbiddenPaths) {
  if (existsSync(path)) {
    throw new Error(`Legacy architecture path must not return: ${path}`);
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const forbiddenDependencies = [
  'bcryptjs',
  'drizzle-kit',
  'drizzle-orm',
  'postgres',
  'stripe',
];

for (const name of forbiddenDependencies) {
  if (packageJson.dependencies?.[name] || packageJson.devDependencies?.[name]) {
    throw new Error(`Legacy dependency must be removed: ${name}`);
  }
}

const compose = readFileSync('docker-compose.backend.yml', 'utf8');
if (!compose.includes('GLOBAL_API_RATE_LIMIT_ENABLE: "false"')) {
  throw new Error('Global per-IP New API limiter must stay disabled behind the JEV BFF');
}
if (!compose.includes('GENERATE_DEFAULT_TOKEN: "false"')) {
  throw new Error('New API automatic default-token generation must stay disabled');
}

console.log('JEV architecture invariants: PASS');
