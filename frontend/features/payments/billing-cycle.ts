import type { PaymentType } from "@/features/groups/types";

const MAX_ANCHOR_DAY = 28;

export const PERIOD_MONTHS: Record<PaymentType, number | null> = {
  MONTHLY: 1,
  TERMLY: 3,
  YEARLY: 12,
  PER_SESSION: null,
};

function dayUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return dayUtc(year, month, Math.min(date.getUTCDate(), lastDayOfTarget));
}

/**
 * The group period that is current on `activeOnDate` for an enrollment,
 * aligned to the group's billing anchor day: the anchor day in the
 * enrollment month, advanced by whole periods until its due date passes.
 * Returns the period start and due date, or null when the group has no
 * recurring period (PER_SESSION).
 */
export function currentBillingPeriod(
  enrollmentDate: string | Date,
  paymentType: PaymentType,
  billingAnchorDay: number,
  activeOnDate: Date,
): { periodStart: Date; dueDate: Date } | null {
  const periodMonths = PERIOD_MONTHS[paymentType];
  if (periodMonths === null) return null;

  const clamped = Math.min(billingAnchorDay, MAX_ANCHOR_DAY);
  const enrolled = new Date(enrollmentDate);
  let periodStart = dayUtc(
    enrolled.getUTCFullYear(),
    enrolled.getUTCMonth(),
    clamped,
  );
  let dueDate = addMonthsClamped(periodStart, periodMonths);

  let guard = 0;
  const activeTime = activeOnDate.getTime();
  while (dueDate.getTime() < activeTime && guard < 1200) {
    guard += 1;
    periodStart = dueDate;
    dueDate = addMonthsClamped(periodStart, periodMonths);
  }
  return { periodStart, dueDate };
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
