import { describe, expect, it } from 'vitest';
import { computeBillingCycle, evaluateRecurring, resolvePaymentStatus } from './payment-cycle.js';

const utcMidnight = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month, day));

describe('evaluateRecurring', () => {
  const enrollment = utcMidnight(2026, 0, 1); // Jan 1, 2026, anchor day 1

  it('returns PENDING for an unpaid window whose due date is still ahead', () => {
    const result = evaluateRecurring(enrollment, 1, [], utcMidnight(2026, 0, 15));
    expect(result.status).toBe('PENDING');
    expect(result.periodStart).toEqual(utcMidnight(2026, 0, 1));
    expect(result.dueDate).toEqual(utcMidnight(2026, 1, 1));
    expect(result.daysOverdue).toBeNull();
  });

  it('returns PENDING on the due date itself instead of OVERDUE', () => {
    const result = evaluateRecurring(enrollment, 1, [], utcMidnight(2026, 1, 1));
    expect(result.status).toBe('PENDING');
  });

  it('goes OVERDUE only the day after the due date, counting 1 day late', () => {
    const result = evaluateRecurring(enrollment, 1, [], utcMidnight(2026, 1, 2));
    expect(result.status).toBe('OVERDUE');
    expect(result.daysOverdue).toBe(1);
  });

  it('counts days overdue from the day after the due date', () => {
    const result = evaluateRecurring(enrollment, 1, [], utcMidnight(2026, 1, 7));
    expect(result.status).toBe('OVERDUE');
    expect(result.daysOverdue).toBe(5);
  });

  it('returns PAID with no overdue for a payment inside the window', () => {
    const result = evaluateRecurring(
      enrollment,
      1,
      [utcMidnight(2026, 0, 10)],
      utcMidnight(2026, 0, 20),
    );
    expect(result.status).toBe('PAID');
    expect(result.daysOverdue).toBeNull();
  });

  it('treats a payment made on the due date as settling that window', () => {
    const result = evaluateRecurring(
      enrollment,
      1,
      [utcMidnight(2026, 1, 1)],
      utcMidnight(2026, 1, 1),
    );
    expect(result.status).toBe('PAID');
  });

  it('credits a period-boundary payment to the window it closes, not double-counted', () => {
    // One payment on Feb 1 settles the Jan 1 -> Feb 1 window only; the next
    // window (Feb 1 -> Mar 1) must remain PENDING.
    const result = evaluateRecurring(
      enrollment,
      1,
      [utcMidnight(2026, 1, 1)],
      utcMidnight(2026, 1, 10),
    );
    expect(result.status).toBe('PENDING');
    expect(result.dueDate).toEqual(utcMidnight(2026, 2, 1));
  });

  it('walks all paid windows and reports the current one when everything is settled', () => {
    const paymentDates = [
      utcMidnight(2026, 0, 1),
      utcMidnight(2026, 1, 5),
      utcMidnight(2026, 2, 9),
    ];
    const result = evaluateRecurring(enrollment, 1, paymentDates, utcMidnight(2026, 2, 15));
    expect(result.status).toBe('PAID');
    expect(result.periodStart).toEqual(utcMidnight(2026, 2, 1));
  });

  it('stops at the first unpaid window even when later payments exist', () => {
    // W1 (Jan 1 -> Feb 1) paid on Jan 25; W2 (Feb 1 -> Mar 1) unpaid and
    // already past its due date by Mar 5: the evaluation surfaces W2 as the
    // problem period rather than looking at any later paid window.
    const result = evaluateRecurring(
      enrollment,
      1,
      [utcMidnight(2026, 0, 25)],
      utcMidnight(2026, 2, 5),
    );
    expect(result.status).toBe('OVERDUE');
    expect(result.dueDate).toEqual(utcMidnight(2026, 2, 1));
  });

  it('counts a payment on the enrollment day for the very first window', () => {
    const result = evaluateRecurring(
      enrollment,
      1,
      [utcMidnight(2026, 0, 1)],
      utcMidnight(2026, 0, 20),
    );
    expect(result.status).toBe('PAID');
  });

  it('clamps the anchor day to 28 for short months', () => {
    const day30Enrollment = utcMidnight(2026, 0, 30);
    const result = evaluateRecurring(day30Enrollment, 1, [], utcMidnight(2026, 1, 1));
    expect(result.periodStart).toEqual(utcMidnight(2026, 0, 28));
    expect(result.dueDate).toEqual(utcMidnight(2026, 1, 28));
  });
});

describe('computeBillingCycle', () => {
  const enrollment = utcMidnight(2026, 0, 20); // anchor day 20

  it('returns the upcoming window before the due date', () => {
    const { periodStart, dueDate } = computeBillingCycle(enrollment, 1, utcMidnight(2026, 0, 5));
    expect(periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 1, 20));
  });

  it('keeps the running window current on the due date itself', () => {
    const { periodStart, dueDate } = computeBillingCycle(enrollment, 1, utcMidnight(2026, 1, 20));
    expect(periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 1, 20));
  });

  it('advances to the next window the day after the due date', () => {
    const { periodStart, dueDate } = computeBillingCycle(enrollment, 1, utcMidnight(2026, 1, 21));
    expect(periodStart).toEqual(utcMidnight(2026, 1, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 2, 20));
  });

  it('advances across multiple periods', () => {
    const { periodStart, dueDate } = computeBillingCycle(enrollment, 1, utcMidnight(2026, 4, 21));
    expect(periodStart).toEqual(utcMidnight(2026, 4, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 5, 20));
  });

  it('supports multi-month periods', () => {
    // A 3-month window runs Jan 20 -> Apr 20; mid-window stays on it.
    const { periodStart, dueDate } = computeBillingCycle(enrollment, 3, utcMidnight(2026, 2, 21));
    expect(periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 3, 20));

    const advanced = computeBillingCycle(enrollment, 3, utcMidnight(2026, 4, 21));
    expect(advanced.periodStart).toEqual(utcMidnight(2026, 3, 20));
    expect(advanced.dueDate).toEqual(utcMidnight(2026, 6, 20));
  });
});

describe('resolvePaymentStatus', () => {
  const dueDate = utcMidnight(2026, 2, 20);

  it('reports PAID when the period has a payment', () => {
    expect(resolvePaymentStatus(true, dueDate, utcMidnight(2026, 2, 25))).toBe('PAID');
  });

  it('reports PENDING on the due date', () => {
    expect(resolvePaymentStatus(false, dueDate, utcMidnight(2026, 2, 20))).toBe('PENDING');
  });

  it('reports OVERDUE only after the due date', () => {
    expect(resolvePaymentStatus(false, dueDate, utcMidnight(2026, 2, 21))).toBe('OVERDUE');
  });
});
