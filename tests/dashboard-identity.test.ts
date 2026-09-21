import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const dashboardPage = readFileSync(
  join(process.cwd(), 'app/(dashboard)/dashboard/page.tsx'),
  'utf8'
);
const dashboardLayout = readFileSync(
  join(process.cwd(), 'app/(dashboard)/layout.tsx'),
  'utf8'
);
const loginActions = readFileSync(
  join(process.cwd(), 'app/(login)/actions.ts'),
  'utf8'
);

test('customer UI uses email identity without exposing New API internals', () => {
  assert.doesNotMatch(dashboardPage, /dashboard\.accountId/);
  assert.doesNotMatch(dashboardPage, /user\.id/);
  assert.doesNotMatch(dashboardPage, /user\.group/);
  assert.match(dashboardPage, /dashboard\.emailNotBound/);
  assert.doesNotMatch(dashboardLayout, /user\.display_name \|\| user\.username/);
  assert.match(dashboardLayout, /dashboard\.emailNotBound/);
  assert.match(loginActions, /if \(!authStatus\.emailVerificationEnabled\)/);
});
