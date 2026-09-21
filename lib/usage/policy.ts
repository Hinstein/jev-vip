export const RESERVATION_CREDITS = 1;

export type SettlementAdjustment = {
  additionalDebit: number;
  refund: number;
};

function assertSafeInteger(value: number, name: string) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a safe integer`);
  }
}

export function calculateSettlementAdjustment(
  reservedCredits: number,
  actualCredits: number
): SettlementAdjustment {
  assertSafeInteger(reservedCredits, 'reservedCredits');
  assertSafeInteger(actualCredits, 'actualCredits');

  if (reservedCredits <= 0 || actualCredits <= 0) {
    throw new Error('Credits must be positive');
  }

  return {
    additionalDebit: Math.max(actualCredits - reservedCredits, 0),
    refund: Math.max(reservedCredits - actualCredits, 0),
  };
}

export function reserveFromBalance(
  balance: number,
  reservationCredits = RESERVATION_CREDITS
) {
  assertSafeInteger(balance, 'balance');
  assertSafeInteger(reservationCredits, 'reservationCredits');

  if (balance < 0 || reservationCredits <= 0) {
    throw new Error('Balance and reservation must be valid positive values');
  }

  if (balance < reservationCredits) {
    return { status: 'insufficient' as const, balance };
  }

  return {
    status: 'reserved' as const,
    balance: balance - reservationCredits,
  };
}

export function settleReservedBalance(
  balanceAfterReservation: number,
  reservedCredits: number,
  actualCredits: number
) {
  assertSafeInteger(balanceAfterReservation, 'balanceAfterReservation');
  if (balanceAfterReservation < 0) {
    throw new Error('Balance cannot be negative');
  }

  const adjustment = calculateSettlementAdjustment(
    reservedCredits,
    actualCredits
  );

  if (balanceAfterReservation < adjustment.additionalDebit) {
    return {
      status: 'over_budget' as const,
      balance: balanceAfterReservation + reservedCredits,
      ...adjustment,
    };
  }

  return {
    status: 'completed' as const,
    balance:
      balanceAfterReservation -
      adjustment.additionalDebit +
      adjustment.refund,
    ...adjustment,
  };
}

export function releaseReservation(
  balanceAfterReservation: number,
  reservedCredits: number
) {
  assertSafeInteger(balanceAfterReservation, 'balanceAfterReservation');
  assertSafeInteger(reservedCredits, 'reservedCredits');

  if (balanceAfterReservation < 0 || reservedCredits <= 0) {
    throw new Error('Balance and reservation must be valid positive values');
  }

  return balanceAfterReservation + reservedCredits;
}
