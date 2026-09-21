import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const loginForm = readFileSync(
  join(process.cwd(), 'app/(login)/login.tsx'),
  'utf8'
);

test('sign-up gates the generic email field when verification is enabled', () => {
  const genericEmailField = loginForm.indexOf(
    '{!emailVerificationEnabled ? ('
  );
  const verificationEmailField = loginForm.indexOf(
    '{emailVerificationEnabled ? ('
  );

  assert.ok(genericEmailField >= 0);
  assert.ok(verificationEmailField > genericEmailField);
  assert.match(
    loginForm.slice(genericEmailField, verificationEmailField),
    /name="email"/
  );
  assert.match(loginForm.slice(verificationEmailField), /name="email"/);
});
