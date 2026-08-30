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
 * The billing anchor is a property of the GROUP, not of any individual
 * enrollment: a single `anchorDay` (1-28) defines the day-of-month every
 * period starts on for every student in the group, so all students share the
 * same due dates regardless of when they joined.
 *
 * The first period a student owes is the group period that is current on
 * their enrollment date (the anchor day falling in the month they joined).
 * Because the anchor is a day-of-month, a student who joins on/after that day
 * enters the running period at its anchor day, and a same-day payment settles
 * that first window. All subsequent periods stay aligned to the group anchor.
 */
export function firstPeriodStart(enrollmentDate: Date, anchorDay: number): Date {
  const clamped = Math.min(anchorDay, MAX_ANCHOR_DAY);
  return new Date(Date.UTC(enrollmentDate.getUTCFullYear(), enrollmentDate.getUTCMonth(), clamped));
}

/**
 * Walks billing windows from the student's first period forward and evaluates
 * the first window without a payment:
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
  anchorDay: number,
  paymentDates: readonly Date[],
  now: Date,
): RecurringEvaluation {
  const firstStart = firstPeriodStart(enrollmentDate, anchorDay);
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
 * The billing anchor is a property of the GROUP (not the enrollment), so the
 * current period is the one aligned to the group's anchor day whose due date
 * has not passed yet (the due date itself is the last day to pay).
 */
export function computeBillingCycle(
  enrollmentDate: Date,
  periodMonths: number,
  anchorDay: number,
  today: Date,
): BillingCycle {
  let periodStart = firstPeriodStart(enrollmentDate, anchorDay);
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
