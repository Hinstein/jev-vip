import assert from 'node:assert/strict';
import test from 'node:test';
import { isLiteLLMConfigured } from '../lib/litellm/config';

const relayEnvironment = [
  'LITELLM_PROXY_URL',
  'LITELLM_MASTER_KEY',
  'LITELLM_SALT_KEY',
  'LITELLM_DATABASE_URL',
  'TYPESAFE_API_BASE',
  'TYPESAFE_API_KEY',
] as const;

test('LiteLLM is not ready until all relay credentials are configured', () => {
  const original = Object.fromEntries(
    relayEnvironment.map((name) => [name, process.env[name]])
  );

  try {
    for (const name of relayEnvironment) delete process.env[name];
    process.env.LITELLM_PROXY_URL = 'http://127.0.0.1:4000';
    process.env.LITELLM_MASTER_KEY = 'master';
    assert.equal(isLiteLLMConfigured(), false);

    for (const name of relayEnvironment) {
      process.env[name] = `${name.toLowerCase()}-configured`;
    }
    assert.equal(isLiteLLMConfigured(), true);

    process.env.TYPESAFE_API_KEY = 'replace-with-official-typesafe-key';
    assert.equal(isLiteLLMConfigured(), false);
  } finally {
    for (const name of relayEnvironment) {
      const value = original[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
