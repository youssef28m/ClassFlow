import { describe, expect, it, vi } from 'vitest';

vi.mock('../middleware/error-handler.js', () => {
  class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode = 500, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
    }
  }
  return { AppError };
});

import { AppError } from '../middleware/error-handler.js';
import { applyCenterScope, assertCanAccessCenter } from './apply-center-scope.js';

const CENTER_ID = 7;

describe('applyCenterScope', () => {
  it('returns { centerId } for models with a direct centerId column', () => {
    for (const model of ['Student', 'Teacher', 'Group', 'Expense', 'User', 'Center'] as const) {
      expect(applyCenterScope(model, CENTER_ID)).toEqual({ centerId: CENTER_ID });
    }
  });

  it('scopes Enrollment through student.centerId (1 hop)', () => {
    expect(applyCenterScope('Enrollment', CENTER_ID)).toEqual({
      student: { centerId: CENTER_ID },
    });
  });

  it('scopes Session and GroupSchedule through group.centerId (1 hop)', () => {
    expect(applyCenterScope('Session', CENTER_ID)).toEqual({ group: { centerId: CENTER_ID } });
    expect(applyCenterScope('GroupSchedule', CENTER_ID)).toEqual({
      group: { centerId: CENTER_ID },
    });
  });

  it('scopes TeacherSalary through teacher.centerId (1 hop)', () => {
    expect(applyCenterScope('TeacherSalary', CENTER_ID)).toEqual({
      teacher: { centerId: CENTER_ID },
    });
  });

  it('scopes Attendance and Payment through enrollment.student.centerId (2 hops)', () => {
    expect(applyCenterScope('Attendance', CENTER_ID)).toEqual({
      enrollment: { student: { centerId: CENTER_ID } },
    });
    expect(applyCenterScope('Payment', CENTER_ID)).toEqual({
      enrollment: { student: { centerId: CENTER_ID } },
    });
  });

  it('returns an empty fragment for superadmin (null center)', () => {
    expect(applyCenterScope('Payment', null)).toEqual({});
    expect(applyCenterScope('Student', null)).toEqual({});
  });
});

describe('assertCanAccessCenter', () => {
  it('lets an all-scope actor through any center', () => {
    expect(() => assertCanAccessCenter('all', null, CENTER_ID)).not.toThrow();
  });

  it('lets a matching center-scope actor through', () => {
    expect(() => assertCanAccessCenter('center', CENTER_ID, CENTER_ID)).not.toThrow();
  });

  it('throws a 404 for a center-scope actor on a foreign center', () => {
    expect(() => assertCanAccessCenter('center', 1, CENTER_ID)).toThrowError(AppError);
    try {
      assertCanAccessCenter('center', 1, CENTER_ID);
      throw new Error('expected assertCanAccessCenter to throw');
    } catch (error) {
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(404);
      } else {
        throw error;
      }
    }
  });
});
