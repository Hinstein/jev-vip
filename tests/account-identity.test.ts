import assert from 'node:assert/strict';
import test from 'node:test';
import {
  newApiUsernameForLogin,
  normalizeEmail,
  usernameForEmail,
} from '@/lib/auth/account-identity';

test('email usernames are deterministic, normalized and New API-safe', () => {
  const first = usernameForEmail('  Person@example.com ');
  const second = usernameForEmail('person@example.com');

  assert.equal(first, second);
  assert.match(first, /^jev_[a-f0-9]{16}$/);
  assert.ok(first.length <= 20);
  assert.equal(normalizeEmail(' Person@example.com '), 'person@example.com');
});

test('email login derives the generated username while legacy names stay intact', () => {
  assert.equal(
    newApiUsernameForLogin('Person@example.com'),
    usernameForEmail('person@example.com')
  );
  assert.equal(newApiUsernameForLogin('legacy_account'), 'legacy_account');
});
