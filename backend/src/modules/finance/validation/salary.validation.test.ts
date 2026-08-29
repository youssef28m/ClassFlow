import { describe, expect, it } from 'vitest';
import {
  calculateSalarySchema,
  createSalarySchema,
  listSalariesQuerySchema,
  paySalarySchema,
  updateSalarySchema,
} from './salary.validation.js';

describe('calculateSalarySchema', () => {
  it('accepts valid inputs and coerces dates', () => {
    const result = calculateSalarySchema.parse({
      teacherId: '5',
      from: '2026-01-01',
      to: '2026-01-31',
      percentage: 70,
    });
    expect(result.teacherId).toBe(5);
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
    expect(result.percentage).toBe(70);
  });

  it('defaults percentage to 70', () => {
    const result = calculateSalarySchema.parse({
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(result.percentage).toBe(70);
  });

  it('accepts a string percentage with two decimals', () => {
    const result = calculateSalarySchema.parse({
      teacherId: 3,
      from: '2026-01-01',
      to: '2026-01-31',
      percentage: '62.50',
    });
    expect(Number(result.percentage)).toBe(62.5);
  });

  it('rejects a percentage above 100', () => {
    expect(() =>
      calculateSalarySchema.parse({
        teacherId: 3,
        from: '2026-01-01',
        to: '2026-01-31',
        percentage: 101,
      }),
    ).toThrow();
  });

  it('rejects a non-positive percentage', () => {
    expect(() =>
      calculateSalarySchema.parse({
        percentage: 0,
        from: '2026-01-01',
        to: '2026-01-31',
      }),
    ).toThrow();
  });
});

describe('paySalarySchema', () => {
  it('accepts valid inputs', () => {
    const result = paySalarySchema.parse({
      teacherId: 2,
      from: '2026-02-01',
      to: '2026-02-28',
      percentage: 70,
      paymentDate: '2026-03-01',
      notes: 'February run',
    });
    expect(result.teacherId).toBe(2);
    expect(result.notes).toBe('February run');
  });

  it('rejects a non-positive teacherId', () => {
    expect(() =>
      paySalarySchema.parse({
        teacherId: 0,
        from: '2026-02-01',
        to: '2026-02-28',
        percentage: 70,
        paymentDate: '2026-03-01',
      }),
    ).toThrow();
  });
});

describe('createSalarySchema amount handling', () => {
  it('accepts a numeric amount', () => {
    const base = {
      teacherId: 1,
      salaryMonth: 2,
      salaryYear: 2026,
      percentage: 70,
      paymentDate: '2026-03-01',
    };
    expect(createSalarySchema.parse({ ...base, amount: 1500, paymentSum: 800 }).amount).toBe(1500);
  });

  it('accepts a string amount with up to 2 decimals', () => {
    const base = {
      teacherId: 1,
      salaryMonth: 2,
      salaryYear: 2026,
      percentage: 70,
      paymentDate: '2026-03-01',
    };
    expect(createSalarySchema.parse({ ...base, amount: '1500.50', paymentSum: '800' }).amount).toBe(
      '1500.50',
    );
  });

  it('rejects a string amount with 3 decimals', () => {
    const base = {
      teacherId: 1,
      salaryMonth: 2,
      salaryYear: 2026,
      percentage: 70,
      paymentDate: '2026-03-01',
    };
    expect(() =>
      createSalarySchema.parse({ ...base, amount: '1500.505', paymentSum: '800' }),
    ).toThrow();
  });

  it('rejects zero and negative amounts', () => {
    const base = {
      teacherId: 1,
      salaryMonth: 2,
      salaryYear: 2026,
      percentage: 70,
      paymentDate: '2026-03-01',
    };
    expect(() => createSalarySchema.parse({ ...base, amount: 0, paymentSum: 1 })).toThrow();
    expect(() => createSalarySchema.parse({ ...base, amount: -5, paymentSum: 1 })).toThrow();
  });
});

describe('listSalariesQuerySchema', () => {
  it('coerces numbers and defaults page/pageSize', () => {
    const result = listSalariesQuerySchema.parse({
      salaryMonth: '3',
      salaryYear: '2026',
    });
    expect(result.salaryMonth).toBe(3);
    expect(result.salaryYear).toBe(2026);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('transforms isPaid strings to booleans', () => {
    expect(listSalariesQuerySchema.parse({ isPaid: 'true' }).isPaid).toBe(true);
    expect(listSalariesQuerySchema.parse({ isPaid: 'false' }).isPaid).toBe(false);
  });
});

describe('updateSalarySchema', () => {
  it('allows partial updates', () => {
    const result = updateSalarySchema.parse({ isPaid: true });
    expect(result.isPaid).toBe(true);
  });

  it('rejects invalid percentage on update', () => {
    expect(() => updateSalarySchema.parse({ percentage: 200 })).toThrow();
  });
});
