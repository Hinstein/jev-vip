import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import postgres from 'postgres';

const databaseUrl = process.env.TEST_DATABASE_URL;
const sql = databaseUrl ? postgres(databaseUrl, { max: 8 }) : null;

let reserveUsageCredits: typeof import('../lib/usage/service').reserveUsageCredits;
let releaseUsageReservation: typeof import('../lib/usage/service').releaseUsageReservation;
let settleUsageReservation: typeof import('../lib/usage/service').settleUsageReservation;
let dbClient: typeof import('../lib/db/drizzle').client | null = null;

type Fixture = { userId: number; apiKeyId: number };

before(async () => {
  if (!databaseUrl) return;
  process.env.POSTGRES_URL = databaseUrl;
  ({ client: dbClient } = await import('../lib/db/drizzle'));
  ({ reserveUsageCredits, releaseUsageReservation, settleUsageReservation } =
    await import('../lib/usage/service'));
});

after(async () => {
  await sql?.end({ timeout: 2 });
  await dbClient?.end({ timeout: 2 });
});

async function createFixture(balance: number): Promise<Fixture> {
  const suffix = randomUUID();
  const [user] = await sql!`
    INSERT INTO users (email, password_hash, role)
    VALUES (${`metering-${suffix}@example.test`}, 'test-hash', 'owner')
    RETURNING id
  `;
  const [apiKey] = await sql!`
    INSERT INTO api_keys (user_id, key_hash, key_name)
    VALUES (${user.id}, ${`hash-${suffix}`}, 'metering test')
    RETURNING id
  `;
  await sql!`
    INSERT INTO user_credit_balances (user_id, balance)
    VALUES (${user.id}, ${balance})
  `;
  return { userId: Number(user.id), apiKeyId: Number(apiKey.id) };
}

async function getBalance(userId: number) {
  const [row] = await sql!`
    SELECT balance::text AS balance
    FROM user_credit_balances
    WHERE user_id = ${userId}
  `;
  return Number(row?.balance ?? 0);
}

async function cleanupFixture({ userId, apiKeyId }: Fixture) {
  await sql!`DELETE FROM credit_transactions WHERE user_id = ${userId}`;
  await sql!`DELETE FROM usage_events WHERE user_id = ${userId}`;
  await sql!`DELETE FROM api_keys WHERE id = ${apiKeyId}`;
  await sql!`DELETE FROM user_credit_balances WHERE user_id = ${userId}`;
  await sql!`DELETE FROM users WHERE id = ${userId}`;
}

function skipWithoutDatabase(t: { skip: (reason?: string) => void }) {
  if (!databaseUrl) {
    t.skip('TEST_DATABASE_URL is not configured');
    return true;
  }
  return false;
}

test('low balance rejects before an upstream call can be charged', async (t) => {
  if (skipWithoutDatabase(t)) return;
  const fixture = await createFixture(0);
  try {
    const result = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId: `low-${randomUUID()}`,
      model: 'jev',
      credits: 1,
    });
    assert.equal(result.status, 'insufficient_credits');
    assert.equal(await getBalance(fixture.userId), 0);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('concurrent reservations cannot overspend the balance', async (t) => {
  if (skipWithoutDatabase(t)) return;
  const fixture = await createFixture(2);
  try {
    const results = await Promise.all(
      [1, 2, 3].map((index) =>
        reserveUsageCredits({
          userId: fixture.userId,
          apiKeyId: fixture.apiKeyId,
          requestId: `concurrent-${index}-${randomUUID()}`,
          model: 'jev',
          credits: 1,
        })
      )
    );
    assert.equal(
      results.filter((result) => result.status === 'reserved').length,
      2
    );
    assert.equal(
      results.filter((result) => result.status === 'insufficient_credits')
        .length,
      1
    );
    assert.equal(await getBalance(fixture.userId), 0);

    for (const result of results) {
      if (result.status === 'reserved') {
        await releaseUsageReservation(result.usageEventId);
      }
    }
    assert.equal(await getBalance(fixture.userId), 2);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('duplicate request ids do not create a second reservation', async (t) => {
  if (skipWithoutDatabase(t)) return;
  const fixture = await createFixture(2);
  const requestId = `duplicate-${randomUUID()}`;
  try {
    const first = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      credits: 1,
    });
    assert.equal(first.status, 'reserved');
    if (first.status !== 'reserved') return;

    const second = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      credits: 1,
    });
    assert.equal(second.status, 'duplicate');
    if (second.status === 'duplicate') {
      assert.equal(second.existingStatus, 'RESERVED');
    }
    assert.equal(await getBalance(fixture.userId), 1);
    await releaseUsageReservation(first.usageEventId);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('an upstream failure releases credits but keeps the request id consumed', async (t) => {
  if (skipWithoutDatabase(t)) return;
  const fixture = await createFixture(1);
  const requestId = `failure-${randomUUID()}`;
  try {
    const first = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      credits: 1,
    });
    assert.equal(first.status, 'reserved');
    if (first.status !== 'reserved') return;
    assert.equal(await releaseUsageReservation(first.usageEventId), true);
    assert.equal(await getBalance(fixture.userId), 1);

    const retry = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      credits: 1,
    });
    assert.equal(retry.status, 'duplicate');
    if (retry.status === 'duplicate') {
      assert.equal(retry.existingStatus, 'CANCELLED');
    }
    assert.equal(await getBalance(fixture.userId), 1);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('successful settlement charges actual tokens and records one ledger row', async (t) => {
  if (skipWithoutDatabase(t)) return;
  const fixture = await createFixture(10);
  const requestId = `settle-${randomUUID()}`;
  try {
    const reservation = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      credits: 1,
    });
    assert.equal(reservation.status, 'reserved');
    if (reservation.status !== 'reserved') return;

    const result = await settleUsageReservation({
      usageEventId: reservation.usageEventId,
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      inputTokens: 2,
      outputTokens: 2,
      totalTokens: 4,
    });
    assert.deepEqual(result, { status: 'completed', balance: 6, credits: 4 });
    assert.equal(await getBalance(fixture.userId), 6);

    const [ledger] = await sql!`
      SELECT amount::text AS amount
      FROM credit_transactions
      WHERE user_id = ${fixture.userId}
        AND reference_id = ${`usage:${fixture.apiKeyId}:${requestId}`}
    `;
    assert.equal(Number(ledger.amount), -4);
  } finally {
    await cleanupFixture(fixture);
  }
});

test('underfunded settlement refunds the reservation and returns no success', async (t) => {
  if (skipWithoutDatabase(t)) return;
  const fixture = await createFixture(1);
  const requestId = `over-budget-${randomUUID()}`;
  try {
    const reservation = await reserveUsageCredits({
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      credits: 1,
    });
    assert.equal(reservation.status, 'reserved');
    if (reservation.status !== 'reserved') return;

    const result = await settleUsageReservation({
      usageEventId: reservation.usageEventId,
      userId: fixture.userId,
      apiKeyId: fixture.apiKeyId,
      requestId,
      model: 'jev',
      inputTokens: 1,
      outputTokens: 1,
      totalTokens: 2,
    });
    assert.deepEqual(result, {
      status: 'over_budget',
      reservedCredits: 1,
      actualCredits: 2,
      balance: 1,
    });
    assert.equal(await getBalance(fixture.userId), 1);
  } finally {
    await cleanupFixture(fixture);
  }
});
