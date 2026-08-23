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

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface BillingCycle {
  periodStart: Date;
  dueDate: Date;
}

/**
 * The billing anchor is the day-of-month the student enrolled on (e.g. the
 * 20th): each period runs from that day to the same day of the next period
 * ("if the group starts at day 20 he should pay before the 20th of next
 * month"). Clamped to 28 so short months cannot shift the schedule.
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
  while (dueDate.getTime() <= today.getTime() && guard < 1200) {
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
  return today.getTime() < dueDate.getTime() ? 'PENDING' : 'OVERDUE';
}
