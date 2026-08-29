import type { PaymentType } from '../../../generated/prisma/client.js';

/**
 * How many months one paid period covers for each group billing cadence.
 * PER_SESSION groups have no recurring period (null): students pay per visit
 * and no due-date tracking applies.
 */
export const PERIOD_MONTHS: Record<PaymentType, number | null> = {
  MONTHLY: 1,
  TERMLY: 3,
  YEARLY: 12,
  PER_SESSION: null,
};

const MAX_ANCHOR_DAY = 28;
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
 * Walks billing windows from enrollment forward and evaluates the first
 * window without a payment:
 *  - unpaid window already ended          -> OVERDUE (days late since its end)
 *  - unpaid window still running          -> PENDING
 *  - every window up to now paid          -> PAID
 *
 * Due-date semantics: a payment made ON the due date settles that window
 * (the due date is inclusive), and a window is only OVERDUE the day AFTER
 * its due date. Window starts are exclusive (except the first) so a payment
 * exactly on a period boundary is credited to the period it closes, never
 * double-counted.
 */
export function evaluateRecurring(
  enrollmentDate: Date,
  periodMonths: number,
  paymentDates: readonly Date[],
  now: Date,
): RecurringEvaluation {
  const anchorDay = Math.min(enrollmentDate.getUTCDate(), MAX_ANCHOR_DAY);
  const firstStart = new Date(
    Date.UTC(enrollmentDate.getUTCFullYear(), enrollmentDate.getUTCMonth(), anchorDay),
  );
  let periodStart = firstStart;

  let guard = 0;
  while (guard < 1200) {
    guard += 1;
    const dueDate = addMonthsClamped(periodStart, periodMonths);
    const inclusiveEnd = new Date(dueDate.getTime() + DAY_MS);
    const paidInWindow = paymentDates.some((date) => {
      const afterStart =
        periodStart.getTime() === firstStart.getTime()
          ? date.getTime() >= periodStart.getTime()
          : date.getTime() > periodStart.getTime();
      return afterStart && date.getTime() <= dueDate.getTime();
    });
    if (!paidInWindow) {
      if (inclusiveEnd.getTime() <= now.getTime()) {
        return {
          status: 'OVERDUE',
          periodStart,
          dueDate,
          daysOverdue: Math.max(1, Math.floor((now.getTime() - inclusiveEnd.getTime()) / DAY_MS)),
        };
      }
      return { status: 'PENDING', periodStart, dueDate, daysOverdue: null };
    }
    if (inclusiveEnd.getTime() > now.getTime()) {
      return { status: 'PAID', periodStart, dueDate, daysOverdue: null };
    }
    periodStart = dueDate;
  }
  return { status: 'OVERDUE', periodStart, dueDate: periodStart, daysOverdue: null };
}

/**
 * The billing anchor is the day-of-month the student enrolled on (e.g. the
 * 20th): each period runs from that day to the same day of the next period
 * ("if the group starts at day 20 he should pay before the 20th of next
 * month"). Clamped to 28 so short months cannot shift the schedule.
 * The current period is the one whose due date has not passed yet (the due
 * date itself is the last day to pay).
 */
export function computeBillingCycle(
  enrollmentDate: Date,
  periodMonths: number,
  today: Date,
): BillingCycle {
  const anchorDay = Math.min(enrollmentDate.getUTCDate(), MAX_ANCHOR_DAY);
  let periodStart = new Date(
    Date.UTC(enrollmentDate.getUTCFullYear(), enrollmentDate.getUTCMonth(), anchorDay),
  );
  let dueDate = addMonthsClamped(periodStart, periodMonths);

  let guard = 0;
  while (dueDate.getTime() < today.getTime() && guard < 1200) {
    guard += 1;
    periodStart = dueDate;
    dueDate = addMonthsClamped(periodStart, periodMonths);
  }
  return { periodStart, dueDate };
}

function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDayOfTarget)));
}

export function resolvePaymentStatus(
  hasPaymentInPeriod: boolean,
  dueDate: Date,
  today: Date,
): PaymentStatus {
  if (hasPaymentInPeriod) return 'PAID';
  return today.getTime() <= dueDate.getTime() ? 'PENDING' : 'OVERDUE';
}
