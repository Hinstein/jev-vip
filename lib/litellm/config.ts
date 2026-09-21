const requiredRelayEnvironment = [
  'LITELLM_PROXY_URL',
  'LITELLM_MASTER_KEY',
  'LITELLM_SALT_KEY',
  'LITELLM_DATABASE_URL',
  'TYPESAFE_API_BASE',
  'TYPESAFE_API_KEY',
] as const;

export function isLiteLLMConfigured() {
  return requiredRelayEnvironment.every((name) => {
    const value = process.env[name]?.trim();
    return Boolean(value && !/replace-with|user:password/i.test(value));
  });
}
