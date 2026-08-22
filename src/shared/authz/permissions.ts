import type { Role } from '../../generated/prisma/client.js';
import type { AuthUser } from '../../modules/auth/types/auth.types.js';

/**
 * Role-based authorization table.
 *
 * This file is the single source of truth for "who can do what". It is written
 * role-major (one block per row of the CMS permission matrix) so it can be
 * audited visually against that matrix. Enforcement lives in
 * `require-permission.ts` (route middleware) and `apply-center-scope.ts`
 * (query scoping); neither contains any permission logic.
 *
 * Semantics:
 *  - Absent [role][resource] entry  -> No Access (default deny).
 *  - scope: 'all'                   -> not center-scoped (SUPERADMIN only).
 *  - scope: 'center'                -> queries must filter by req.centerId.
 *  - actions                        -> explicit verbs; never collapse to CRUD.
 */

export const RESOURCES = [
  'centers',
  'users',
  'students',
  'teachersAndSalaries',
  'groupsAndSessions',
  'paymentsAndExpenses',
] as const;

export type Resource = (typeof RESOURCES)[number];

/**
 * The action vocabulary per resource. Defined once here; every grant in the
 * table below is type-checked against these tuples, so a misspelled or
 * nonexistent action is a compile error.
 */
export const RESOURCE_ACTIONS = {
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
    'manageGroups', // create/update/delete groups (delete confirmed allowed for MANAGER)
    'manageSchedules', // create/update GroupSchedule entries
    'manageSessions', // create sessions, mark complete
    'markAttendance', // mark Attendance records
  ],
  paymentsAndExpenses: [
    'read',
    'logPayment', // create + update a payment (no delete) — RECEPTIONIST
    'managePayments', // full CRUD on payments
    'createExpense',
    'manageExpenses', // full CRUD on expenses
  ],
} as const satisfies Record<Resource, readonly string[]>;

export type ActionsOf<R extends Resource> = (typeof RESOURCE_ACTIONS)[R][number];

export interface Grant {
  /** 'all' bypasses center scoping entirely; 'center' locks to req.centerId. */
  scope: 'all' | 'center';
  actions: readonly ActionsOf<Resource>[];
}

/** Role -> Resource -> Grant. Missing resource key means No Access. */
export type PermissionTable = Record<Role, Partial<Record<Resource, Grant>>>;

export const PERMISSIONS: PermissionTable = {
  // ── SUPERADMIN ─ Full (All) on every resource. centerId is null on token;
  //    scoping is bypassed ('all'), optionally narrowed via ?centerId= by
  //    the existing requireCenterScope middleware.
  SUPERADMIN: {
    centers: { scope: 'all', actions: ['read', 'create', 'update', 'delete'] },
    users: { scope: 'all', actions: ['read', 'create', 'update', 'delete'] },
    students: { scope: 'all', actions: ['read', 'create', 'update', 'delete'] },
    teachersAndSalaries: {
      scope: 'all',
      actions: [
        'readTeachers',
        'createTeacher',
        'updateTeacher',
        'deleteTeacher',
        'manageSalaries',
      ],
    },
    groupsAndSessions: {
      scope: 'all',
      actions: ['read', 'manageGroups', 'manageSchedules', 'manageSessions', 'markAttendance'],
    },
    paymentsAndExpenses: {
      scope: 'all',
      actions: ['read', 'logPayment', 'managePayments', 'createExpense', 'manageExpenses'],
    },
  },

  // ── ADMIN ─ Everything inside their own center. User management is further
  //    restricted by canManageUserAccount(): only roles below ADMIN.
  ADMIN: {
    centers: { scope: 'center', actions: ['read'] },
    users: { scope: 'center', actions: ['read', 'create', 'update', 'delete'] },
    students: { scope: 'center', actions: ['read', 'create', 'update', 'delete'] },
    teachersAndSalaries: {
      scope: 'center',
      actions: [
        'readTeachers',
        'createTeacher',
        'updateTeacher',
        'deleteTeacher',
        'manageSalaries',
      ],
    },
    groupsAndSessions: {
      scope: 'center',
      actions: ['read', 'manageGroups', 'manageSchedules', 'manageSessions', 'markAttendance'],
    },
    paymentsAndExpenses: {
      scope: 'center',
      actions: ['read', 'logPayment', 'managePayments', 'createExpense', 'manageExpenses'],
    },
  },

  // ── MANAGER ─ Full operational control of academics and staff; no user
  //    administration; expenses can be raised but not edited/deleted.
  MANAGER: {
    centers: { scope: 'center', actions: ['read'] },
    students: { scope: 'center', actions: ['read', 'create', 'update', 'delete'] },
    teachersAndSalaries: {
      scope: 'center',
      actions: [
        'readTeachers',
        'createTeacher',
        'updateTeacher',
        'deleteTeacher',
        'manageSalaries',
      ],
    },
    groupsAndSessions: {
      scope: 'center',
      actions: ['read', 'manageGroups', 'manageSchedules', 'manageSessions', 'markAttendance'],
    },
    paymentsAndExpenses: { scope: 'center', actions: ['read', 'createExpense'] },
  },

  // ── ACCOUNTANT ─ Finance-focused: salaries, payments, expenses. Teacher
  //    roster is read-only (context for salary runs). No centers/users.
  ACCOUNTANT: {
    students: { scope: 'center', actions: ['read'] },
    teachersAndSalaries: {
      scope: 'center',
      actions: ['readTeachers', 'manageSalaries'],
    },
    groupsAndSessions: { scope: 'center', actions: ['read'] },
    paymentsAndExpenses: {
      scope: 'center',
      actions: ['read', 'managePayments', 'createExpense', 'manageExpenses'],
    },
  },

  // ── RECEPTIONIST ─ Front desk: student intake/edits, view groups, take
  //    attendance, log payments (create/update only — no deletes, no reads
  //    beyond what their own flows need). No centers/users/salaries/expenses.
  RECEPTIONIST: {
    students: { scope: 'center', actions: ['read', 'create', 'update'] },
    teachersAndSalaries: { scope: 'center', actions: ['readTeachers'] },
    groupsAndSessions: { scope: 'center', actions: ['read', 'markAttendance'] },
    paymentsAndExpenses: { scope: 'center', actions: ['logPayment'] },
  },
};

/**
 * Pure authorization check. `user` must be the already-authenticated
 * `req.user` (JWT verification happens elsewhere; this never inspects tokens).
 */
export function can(user: AuthUser, resource: Resource, action: string): boolean {
  if (user.role === 'SUPERADMIN') return true;
  const grant = PERMISSIONS[user.role][resource];
  return grant !== undefined && (grant.actions as readonly string[]).includes(action);
}

/** Resolves the data scope of an authorized request: global vs center-locked. */
export function resolveScope(user: AuthUser): 'all' | 'center' {
  return user.role === 'SUPERADMIN' ? 'all' : 'center';
}

const ROLE_RANK: Record<Role, number> = {
  SUPERADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  ACCOUNTANT: 1,
  RECEPTIONIST: 0,
};

/**
 * Target-level rule for user management that the matrix cannot express alone:
 * ADMINs may only manage accounts strictly below them (MANAGER, ACCOUNTANT,
 * RECEPTIONIST). Creating/editing ADMIN or SUPERADMIN accounts requires
 * SUPERADMIN. Check this in the users service in addition to
 * `can(actor, 'users', action)`.
 */
export function canManageUserAccount(actor: Pick<AuthUser, 'role'>, targetRole: Role): boolean {
  if (actor.role === 'SUPERADMIN') return true;
  if (actor.role === 'ADMIN') return ROLE_RANK[targetRole] < ROLE_RANK.ADMIN;
  return false;
}
