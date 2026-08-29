import { describe, expect, it } from 'vitest';
import type { Role } from '../../generated/prisma/client.js';
import type { AuthUser } from '../../modules/auth/types/auth.types.js';
import {
  type ActionsOf,
  can,
  canManageUserAccount,
  RESOURCES,
  type Resource,
  resolveScope,
} from './permissions.js';

const user = (role: Role): AuthUser => ({ id: 1, username: 'tester', role, centerId: 1 });

/** Every (resource, action) pair a role may perform per the matrix. */
function grantedActions(role: Role): Array<[Resource, string]> {
  const granted = new Set<string>();
  const table: Record<Resource, readonly string[]> = {
    centers: ['read', 'create', 'update', 'delete'],
    users: ['read', 'create', 'update', 'delete'],
    students: ['read', 'create', 'update', 'delete'],
    teachersAndSalaries: [
      'readTeachers',
      'createTeacher',
      'updateTeacher',
      'deleteTeacher',
      'manageSalaries',
    ],
    groupsAndSessions: [
      'read',
      'manageGroups',
      'manageSchedules',
      'manageSessions',
      'markAttendance',
    ],
    paymentsAndExpenses: [
      'read',
      'logPayment',
      'managePayments',
      'createExpense',
      'manageExpenses',
    ],
  };
  for (const resource of RESOURCES) {
    for (const action of table[resource]) {
      if (can(user(role), resource, action as ActionsOf<Resource>)) {
        granted.add(`${resource}:${action}`);
      }
    }
  }
  return [...granted].map((pair) => {
    const [resource, action] = pair.split(':') as [Resource, string];
    return [resource, action];
  });
}

describe('permission matrix', () => {
  it('SUPERADMIN can do everything', () => {
    for (const resource of ['centers', 'users', 'students'] as const) {
      for (const action of ['read', 'create', 'update', 'delete'] as const) {
        expect(can(user('SUPERADMIN'), resource, action)).toBe(true);
      }
    }
    for (const action of [
      'read',
      'manageGroups',
      'manageSchedules',
      'manageSessions',
      'markAttendance',
    ] as const) {
      expect(can(user('SUPERADMIN'), 'groupsAndSessions', action)).toBe(true);
    }
    for (const action of [
      'readTeachers',
      'createTeacher',
      'updateTeacher',
      'deleteTeacher',
      'manageSalaries',
    ] as const) {
      expect(can(user('SUPERADMIN'), 'teachersAndSalaries', action)).toBe(true);
    }
    for (const action of [
      'read',
      'logPayment',
      'managePayments',
      'createExpense',
      'manageExpenses',
    ] as const) {
      expect(can(user('SUPERADMIN'), 'paymentsAndExpenses', action)).toBe(true);
    }
    expect(grantedActions('SUPERADMIN').length).toBeGreaterThan(24);
  });

  it('ADMIN is full within the center, but centers are read-only', () => {
    expect(can(user('ADMIN'), 'centers', 'read')).toBe(true);
    expect(can(user('ADMIN'), 'centers', 'create')).toBe(false);
    expect(can(user('ADMIN'), 'users', 'delete')).toBe(true);
    expect(can(user('ADMIN'), 'students', 'create')).toBe(true);
  });

  it('ADMIN cannot access centers/users of other centers (scope resolve)', () => {
    expect(resolveScope(user('ADMIN'))).toBe('center');
  });

  it('MANAGER has no users access and no payment management', () => {
    expect(can(user('MANAGER'), 'users', 'read')).toBe(false);
    expect(can(user('MANAGER'), 'paymentsAndExpenses', 'read')).toBe(true);
    expect(can(user('MANAGER'), 'paymentsAndExpenses', 'createExpense')).toBe(true);
    expect(can(user('MANAGER'), 'paymentsAndExpenses', 'managePayments')).toBe(false);
    expect(can(user('MANAGER'), 'paymentsAndExpenses', 'manageExpenses')).toBe(false);
    expect(can(user('MANAGER'), 'groupsAndSessions', 'manageGroups')).toBe(true);
  });

  it('ACCOUNTANT is read-only on academics, full on finances', () => {
    expect(can(user('ACCOUNTANT'), 'students', 'read')).toBe(true);
    expect(can(user('ACCOUNTANT'), 'students', 'create')).toBe(false);
    expect(can(user('ACCOUNTANT'), 'teachersAndSalaries', 'manageSalaries')).toBe(true);
    expect(can(user('ACCOUNTANT'), 'paymentsAndExpenses', 'managePayments')).toBe(true);
    expect(can(user('ACCOUNTANT'), 'centers', 'read')).toBe(false);
  });

  it('RECEPTIONIST manages students but can only log payments', () => {
    expect(can(user('RECEPTIONIST'), 'students', 'create')).toBe(true);
    expect(can(user('RECEPTIONIST'), 'students', 'update')).toBe(true);
    expect(can(user('RECEPTIONIST'), 'students', 'delete')).toBe(false);
    expect(can(user('RECEPTIONIST'), 'paymentsAndExpenses', 'logPayment')).toBe(true);
    expect(can(user('RECEPTIONIST'), 'paymentsAndExpenses', 'read')).toBe(false);
    expect(can(user('RECEPTIONIST'), 'paymentsAndExpenses', 'managePayments')).toBe(false);
    expect(can(user('RECEPTIONIST'), 'groupsAndSessions', 'markAttendance')).toBe(true);
    expect(can(user('RECEPTIONIST'), 'groupsAndSessions', 'read')).toBe(true);
  });

  it('defaults to deny for resources absent from a role', () => {
    expect(can(user('MANAGER'), 'users', 'read')).toBe(false);
    expect(can(user('ACCOUNTANT'), 'users', 'read')).toBe(false);
    expect(can(user('RECEPTIONIST'), 'teachersAndSalaries', 'manageSalaries')).toBe(false);
  });
});

describe('resolveScope', () => {
  it('resolves SUPERADMIN to the global scope', () => {
    expect(resolveScope(user('SUPERADMIN'))).toBe('all');
  });

  it('resolves every center role to the center scope', () => {
    for (const role of ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST'] as const) {
      expect(resolveScope(user(role))).toBe('center');
    }
  });
});

describe('canManageUserAccount', () => {
  it('SUPERADMIN may manage any role', () => {
    for (const role of ['SUPERADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST'] as const) {
      expect(canManageUserAccount(user('SUPERADMIN'), role)).toBe(true);
    }
  });

  it('ADMIN manages only roles strictly below ADMIN', () => {
    expect(canManageUserAccount(user('ADMIN'), 'MANAGER')).toBe(true);
    expect(canManageUserAccount(user('ADMIN'), 'ACCOUNTANT')).toBe(true);
    expect(canManageUserAccount(user('ADMIN'), 'RECEPTIONIST')).toBe(true);
    expect(canManageUserAccount(user('ADMIN'), 'ADMIN')).toBe(false);
    expect(canManageUserAccount(user('ADMIN'), 'SUPERADMIN')).toBe(false);
  });

  it('other roles cannot manage any account', () => {
    for (const role of ['MANAGER', 'ACCOUNTANT', 'RECEPTIONIST'] as const) {
      expect(canManageUserAccount(user(role), 'RECEPTIONIST')).toBe(false);
      expect(canManageUserAccount(user(role), 'SUPERADMIN')).toBe(false);
    }
  });
});
