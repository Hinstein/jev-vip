import { createHash } from 'node:crypto';

const GENERATED_USERNAME_PREFIX = 'jev_';
const GENERATED_USERNAME_HASH_LENGTH = 16;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * New API requires a username even when the customer-facing account is email-based.
 * Keep that implementation detail deterministic so the stateless storefront can
 * derive the same login username from the email address on every request.
 */
export function usernameForEmail(email: string) {
  const normalized = normalizeEmail(email);
  const digest = createHash('sha256')
    .update(normalized, 'utf8')
    .digest('hex')
    .slice(0, GENERATED_USERNAME_HASH_LENGTH);

  return `${GENERATED_USERNAME_PREFIX}${digest}`;
}

export function newApiUsernameForLogin(identifier: string) {
  const value = identifier.trim();
  return value.includes('@') ? usernameForEmail(value) : value;
}
