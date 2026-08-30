import { describe, expect, it } from 'vitest';
import {
  computeBillingCycle,
  evaluateRecurring,
  firstPeriodStart,
  resolvePaymentStatus,
} from './payment-cycle.js';

const utcMidnight = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month, day));

describe('firstPeriodStart', () => {
  it('starts at the anchor day when the enrollment day equals it', () => {
    expect(firstPeriodStart(utcMidnight(2026, 0, 20), 20)).toEqual(utcMidnight(2026, 0, 20));
  });

  it('starts at the anchor day later in the same month', () => {
    expect(firstPeriodStart(utcMidnight(2026, 0, 15), 20)).toEqual(utcMidnight(2026, 0, 20));
  });

  it('starts at the anchor day even when the enrollment day is later in the month', () => {
    // Enroll Jan 25 in a group anchored day 20 -> first period is the group
    // period current on the join date, i.e. Jan 20.
    expect(firstPeriodStart(utcMidnight(2026, 0, 25), 20)).toEqual(utcMidnight(2026, 0, 20));
  });
});

describe('evaluateRecurring', () => {
  it('returns PENDING for an unpaid window whose due date is still ahead', () => {
    const result = evaluateRecurring(utcMidnight(2026, 0, 1), 1, 1, [], utcMidnight(2026, 0, 15));
    expect(result.status).toBe('PENDING');
    expect(result.periodStart).toEqual(utcMidnight(2026, 0, 1));
    expect(result.dueDate).toEqual(utcMidnight(2026, 1, 1));
    expect(result.daysOverdue).toBeNull();
  });

  it('returns PENDING on the due date itself instead of OVERDUE', () => {
    const result = evaluateRecurring(utcMidnight(2026, 0, 1), 1, 1, [], utcMidnight(2026, 1, 1));
    expect(result.status).toBe('PENDING');
  });

  it('goes OVERDUE only the day after the due date, counting 1 day late', () => {
    const result = evaluateRecurring(utcMidnight(2026, 0, 1), 1, 1, [], utcMidnight(2026, 1, 2));
    expect(result.status).toBe('OVERDUE');
    expect(result.daysOverdue).toBe(1);
  });

  it('counts days overdue from the day after the due date', () => {
    const result = evaluateRecurring(utcMidnight(2026, 0, 1), 1, 1, [], utcMidnight(2026, 1, 7));
    expect(result.status).toBe('OVERDUE');
    expect(result.daysOverdue).toBe(5);
  });

  it('returns PAID with no overdue for a payment inside the window', () => {
    const result = evaluateRecurring(
      utcMidnight(2026, 0, 1),
      1,
      1,
      [utcMidnight(2026, 0, 10)],
      utcMidnight(2026, 0, 20),
    );
    expect(result.status).toBe('PAID');
    expect(result.daysOverdue).toBeNull();
  });

  it('treats a payment made on the due date as settling that window', () => {
    const result = evaluateRecurring(
      utcMidnight(2026, 0, 1),
      1,
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
      utcMidnight(2026, 0, 1),
      1,
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
    const result = evaluateRecurring(
      utcMidnight(2026, 0, 1),
      1,
      1,
      paymentDates,
      utcMidnight(2026, 2, 15),
    );
    expect(result.status).toBe('PAID');
    expect(result.periodStart).toEqual(utcMidnight(2026, 2, 1));
  });

  it('stops at the first unpaid window even when later payments exist', () => {
    const result = evaluateRecurring(
      utcMidnight(2026, 0, 1),
      1,
      1,
      [utcMidnight(2026, 0, 25)],
      utcMidnight(2026, 2, 5),
    );
    expect(result.status).toBe('OVERDUE');
    expect(result.dueDate).toEqual(utcMidnight(2026, 2, 1));
  });

  it('counts a payment on the enrollment day for the very first window', () => {
    const result = evaluateRecurring(
      utcMidnight(2026, 0, 1),
      1,
      1,
      [utcMidnight(2026, 0, 1)],
      utcMidnight(2026, 0, 20),
    );
    expect(result.status).toBe('PAID');
  });

  it('aligns a mid-period joiner to the group anchor day in the join month', () => {
    // Enroll Jan 25 in a group anchored day 20: first period starts Jan 20 (the
    // group period current on the join date) and is pending into early Feb.
    const result = evaluateRecurring(utcMidnight(2026, 0, 25), 1, 20, [], utcMidnight(2026, 1, 5));
    expect(result.status).toBe('PENDING');
    expect(result.periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(result.dueDate).toEqual(utcMidnight(2026, 1, 20));
  });

  it('marks a same-day-on-join payment as PAID even after the anchor day', () => {
    // Enroll Aug 25 in a group anchored day 7, pay Aug 25 on joining: the
    // first period (Aug 7 -> Sep 7) was current when they joined, so this
    // payment settles it instead of leaving them PENDING.
    const result = evaluateRecurring(
      utcMidnight(2026, 7, 25),
      1,
      7,
      [utcMidnight(2026, 7, 25)],
      utcMidnight(2026, 7, 30),
    );
    expect(result.status).toBe('PAID');
    expect(result.periodStart).toEqual(utcMidnight(2026, 7, 7));
    expect(result.dueDate).toEqual(utcMidnight(2026, 8, 7));
  });

  it('all students in a group share the same anchor regardless of join date', () => {
    // Same group (anchor day 7): one student enrolled Jan 7, another Jan 25.
    // Both fall onto the same period boundary schedule.
    const early = evaluateRecurring(utcMidnight(2026, 0, 7), 1, 7, [], utcMidnight(2026, 0, 15));
    const late = evaluateRecurring(utcMidnight(2026, 0, 25), 1, 7, [], utcMidnight(2026, 0, 15));
    expect(early.periodStart).toEqual(utcMidnight(2026, 0, 7));
    expect(late.periodStart).toEqual(utcMidnight(2026, 0, 7));
    expect(early.dueDate).toEqual(utcMidnight(2026, 1, 7));
    expect(late.dueDate).toEqual(utcMidnight(2026, 1, 7));
  });

  it('clamps the anchor day to 28 for short months', () => {
    // Group anchored day 28; enroll Jan 30 -> first period is the group period
    // current on the join date, i.e. Jan 28, due Feb 28.
    const result = evaluateRecurring(utcMidnight(2026, 0, 30), 1, 28, [], utcMidnight(2026, 1, 1));
    expect(result.status).toBe('PENDING');
    expect(result.periodStart).toEqual(utcMidnight(2026, 0, 28));
    expect(result.dueDate).toEqual(utcMidnight(2026, 1, 28));
  });
});

describe('computeBillingCycle', () => {
  it('returns the upcoming window before the due date', () => {
    const { periodStart, dueDate } = computeBillingCycle(
      utcMidnight(2026, 0, 20),
      1,
      20,
      utcMidnight(2026, 0, 5),
    );
    expect(periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 1, 20));
  });

  it('keeps the running window current on the due date itself', () => {
    const { periodStart, dueDate } = computeBillingCycle(
      utcMidnight(2026, 0, 20),
      1,
      20,
      utcMidnight(2026, 1, 20),
    );
    expect(periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 1, 20));
  });

  it('advances to the next window the day after the due date', () => {
    const { periodStart, dueDate } = computeBillingCycle(
      utcMidnight(2026, 0, 20),
      1,
      20,
      utcMidnight(2026, 1, 21),
    );
    expect(periodStart).toEqual(utcMidnight(2026, 1, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 2, 20));
  });

  it('advances across multiple periods', () => {
    const { periodStart, dueDate } = computeBillingCycle(
      utcMidnight(2026, 0, 20),
      1,
      20,
      utcMidnight(2026, 4, 21),
    );
    expect(periodStart).toEqual(utcMidnight(2026, 4, 20));
    expect(dueDate).toEqual(utcMidnight(2026, 5, 20));
  });

  it('supports multi-month periods', () => {
    // A 3-month window runs Jan 20 -> Apr 20; mid-window stays on it.
    const mid = computeBillingCycle(utcMidnight(2026, 0, 20), 3, 20, utcMidnight(2026, 2, 21));
    expect(mid.periodStart).toEqual(utcMidnight(2026, 0, 20));
    expect(mid.dueDate).toEqual(utcMidnight(2026, 3, 20));

    const advanced = computeBillingCycle(utcMidnight(2026, 0, 20), 3, 20, utcMidnight(2026, 4, 21));
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
