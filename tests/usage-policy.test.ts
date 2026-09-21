import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateSettlementAdjustment,
  releaseReservation,
  reserveFromBalance,
  settleReservedBalance,
} from '../lib/usage/policy';

test('a low balance cannot reserve the minimum request credit', () => {
  assert.deepEqual(reserveFromBalance(0), {
    status: 'insufficient',
    balance: 0,
  });
});

test('two concurrent one-credit reservations consume exactly two credits', () => {
  const first = reserveFromBalance(2);
  assert.equal(first.status, 'reserved');
  if (first.status !== 'reserved') return;

  const second = reserveFromBalance(first.balance);
  assert.equal(second.status, 'reserved');
  if (second.status !== 'reserved') return;

  const third = reserveFromBalance(second.balance);
  assert.equal(third.status, 'insufficient');
  assert.equal(second.balance, 0);
});

test('an upstream failure refunds the reservation', () => {
  assert.equal(releaseReservation(9, 1), 10);
});

test('settlement debits actual tokens after the minimum reservation', () => {
  assert.deepEqual(calculateSettlementAdjustment(1, 4), {
    additionalDebit: 3,
    refund: 0,
  });
  assert.deepEqual(settleReservedBalance(9, 1, 4), {
    status: 'completed',
    balance: 6,
    additionalDebit: 3,
    refund: 0,
  });
});

test('underfunded settlement restores the reservation and cannot succeed', () => {
  assert.deepEqual(settleReservedBalance(0, 1, 2), {
    status: 'over_budget',
    balance: 1,
    additionalDebit: 1,
    refund: 0,
  });
});
