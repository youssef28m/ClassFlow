import type { PaymentType } from '../../../generated/prisma/client.js';

/**
 * Billing period length for each payment cadence.
 * `PER_SESSION` has no recurring period and is skipped by recurring billing.
 */
export const PERIOD_MONTHS: Record<PaymentType, number | null> = {
  MONTHLY: 1,
  TERMLY: 3,
  YEARLY: 12,
  PER_SESSION: null,
};

// Keep anchor dates inside a valid month boundary for all groups.
const MAX_ANCHOR_DAY = 28;
// A payment on the due date is still accepted; the period becomes overdue only after that date.
const DAY_MS = 86_400_000;

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface BillingCycle {
  periodStart: Date;
  dueDate: Date;
}

export interface RecurringEvaluation extends BillingCycle {
  status: PaymentStatus;
  daysOverdue: number | null;
}

/**
 * Returns the first group-aligned billing period for a student's enrollment.
 */
export function firstPeriodStart(enrollmentDate: Date, anchorDay: number): Date {
  const clamped = Math.min(anchorDay, MAX_ANCHOR_DAY);
  return new Date(Date.UTC(enrollmentDate.getUTCFullYear(), enrollmentDate.getUTCMonth(), clamped));
}

/**
 * Finds the first unpaid recurring period from the enrollment date onward.
 */
export function evaluateRecurring(
  enrollmentDate: Date,
  periodMonths: number,
  anchorDay: number,
  payments: readonly PaymentInput[],
  now: Date,
): RecurringEvaluation {
  const firstStart = firstPeriodStart(enrollmentDate, anchorDay);
  // Normalize inputs so callers can pass either raw dates or objects carrying
  // an explicit targetPeriodStart. Dates without a target are matched by range.
  const normalized = payments.map(toPaymentWithTarget);
  let periodStart = firstStart;

  // Walk every billing window forward from the student's first period. The
  // guard bounds the loop defensively so a malformed input cannot hang it.
  let guard = 0;
  while (guard < 1200) {
    guard += 1;
    const dueDate = addMonthsClamped(periodStart, periodMonths);
    // The due date is inclusive (a payment on it settles the period), so the
    // window effectively closes at the start of the following day.
    const inclusiveEnd = new Date(dueDate.getTime() + DAY_MS);
    const paidInWindow = normalized.some((p) => paymentCoversWindow(p, periodStart, firstStart, dueDate));
    if (!paidInWindow) {
      // No payment in this window: it is OVERDUE if its due date has passed,
      // otherwise it is the current period and still PENDING.
      if (inclusiveEnd.getTime() <= now.getTime()) {
        return {
          status: 'OVERDUE',
          periodStart,
          dueDate,
          // Days late are counted from the day AFTER the due date (hence the
          // `- inclusiveEnd`), always at least 1 so an overdue period is never
          // reported as "0 days late".
          daysOverdue: Math.max(1, Math.floor((now.getTime() - inclusiveEnd.getTime()) / DAY_MS)),
        };
      }
      return { status: 'PENDING', periodStart, dueDate, daysOverdue: null };
    }
    // There is a payment in this window. If the window has not fully ended yet
    // it is the running/current period and the student is PAID up to now.
    if (inclusiveEnd.getTime() > now.getTime()) {
      return { status: 'PAID', periodStart, dueDate, daysOverdue: null };
    }
    // The window is closed and paid: move on to the next period.
    periodStart = dueDate;
  }
  // Guard exit (should not normally happen): report as overdue defensively.
  return { status: 'OVERDUE', periodStart, dueDate: periodStart, daysOverdue: null };
}

/**
 * Gets the billing window that contains the provided date.
 */
export function computeBillingCycle(enrollmentDate: Date, periodMonths: number, anchorDay: number, today: Date): BillingCycle {
  let periodStart = firstPeriodStart(enrollmentDate, anchorDay);
  let dueDate = addMonthsClamped(periodStart, periodMonths);

  // Advance whole periods forward until the running window is the one that
  // contains (or is due on) `today`. The loop stops as soon as the current
  // window's due date is on/after today, so the item displayed is the active
  // billing period.
  let guard = 0;
  while (dueDate.getTime() < today.getTime() && guard < 1200) {
    guard += 1;
    periodStart = dueDate;
    dueDate = addMonthsClamped(periodStart, periodMonths);
  }
  return { periodStart, dueDate };
}

/**
 * Adds months while clamping to the last valid day in shorter months.
 */
function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  // `new Date(UTC(y, m+1, 0))` gives the last day of month `m` (day 0 of the
  // following month), used to cap the day-of-month for short target months.
  const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDayOfTarget)));
}

/**
 * Resolves a single period's payment state from a boolean payment flag.
 */
export function resolvePaymentStatus(hasPaymentInPeriod: boolean, dueDate: Date, today: Date): PaymentStatus {
  if (hasPaymentInPeriod) return 'PAID';
  return today.getTime() <= dueDate.getTime() ? 'PENDING' : 'OVERDUE';
}

/**
 * A payment with an optional explicit billing period.
 */
export interface PaymentWithTarget {
  paymentDate: Date;
  targetPeriodStart?: Date | null;
}

/**
 * Accepted input types for recurring-period matching.
 */
export type PaymentInput = Date | PaymentWithTarget;

function toPaymentWithTarget(payment: PaymentInput): PaymentWithTarget {
  return payment instanceof Date ? { paymentDate: payment } : payment;
}

/**
 * A generated recurring billing period and its payment summary.
 */
export interface PeriodInfo {
  periodStart: Date;
  dueDate: Date;
  status: PaymentStatus | 'UNPAID';
  totalPaid: number;
}

/**
 * Checks whether a payment belongs to a specific billing window.
 *
 * When a payment carries an explicit `targetPeriodStart` it is attributed to
 * exactly that window. Otherwise it is matched by date range, where the very
 * first period's start is inclusive (`>=`) — so a student who pays on the same
 * day they enroll settles their first period — while later periods are
 * exclusive (`>`) to avoid double-counting boundary payments.
 */
export function paymentCoversWindow(payment: PaymentWithTarget, periodStart: Date, firstStart: Date, dueDate: Date): boolean {
  if (payment.targetPeriodStart) {
    return payment.targetPeriodStart.getTime() === periodStart.getTime();
  }
  const afterStart =
    periodStart.getTime() === firstStart.getTime()
      ? payment.paymentDate.getTime() >= periodStart.getTime()
      : payment.paymentDate.getTime() > periodStart.getTime();
  return afterStart && payment.paymentDate.getTime() <= dueDate.getTime();
}

/**
 * Builds the active and upcoming billing periods with aggregated payment totals.
 */
export function generatePeriodsWithAmounts(
  enrollmentDate: Date,
  periodMonths: number,
  anchorDay: number,
  payments: readonly { amount: number; paymentDate: Date; targetPeriodStart?: Date | null }[],
  now: Date,
): PeriodInfo[] {
  // PER_SESSION groups have no recurring periods, so nothing to generate.
  if (periodMonths === null) return [];

  const firstStart = firstPeriodStart(enrollmentDate, anchorDay);
  const periods: PeriodInfo[] = [];
  let periodStart = firstStart;

  // Generate windows from the first period forward, stopping once we have
  // produced the current running period plus one future period.
  let guard = 0;
  while (guard < 1200) {
    guard += 1;
    const dueDate = addMonthsClamped(periodStart, periodMonths);

    // Collect every payment that belongs to this window (by explicit target or
    // by date range) and sum what was paid into it.
    const matchedPayments = payments.filter((p) => {
      if (p.targetPeriodStart) {
        return p.targetPeriodStart.getTime() === periodStart.getTime();
      }
      const afterStart =
        periodStart.getTime() === firstStart.getTime()
          ? p.paymentDate.getTime() >= periodStart.getTime()
          : p.paymentDate.getTime() > periodStart.getTime();
      return afterStart && p.paymentDate.getTime() <= dueDate.getTime();
    });
    const totalPaid = matchedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Classify the window: PAID if it has any payment; otherwise OVERDUE if its
    // due date has passed, PENDING if it is the currently running period, or
    // UNPAID if it has not started yet.
    const inclusiveEnd = new Date(dueDate.getTime() + DAY_MS);
    let status: PeriodInfo['status'];
    if (matchedPayments.length > 0) {
      status = 'PAID';
    } else if (inclusiveEnd.getTime() <= now.getTime()) {
      status = 'OVERDUE';
    } else if (periodStart.getTime() <= now.getTime()) {
      status = 'PENDING';
    } else {
      status = 'UNPAID';
    }

    periods.push({ periodStart, dueDate, status, totalPaid });

    // Stop after emitting one period beyond today (a future, unpaid window).
    if (periodStart.getTime() > now.getTime()) break;
    periodStart = dueDate;
  }

  return periods;
}
