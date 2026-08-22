import { AppError } from '../middleware/error-handler.js';

/**
 * Builds the Prisma `where` fragment that locks a query to a center.
 *
 * Models WITHOUT a direct centerId column reach it through these relation
 * chains (verified against prisma/schema.prisma — do not "simplify" them):
 *
 *   Enrollment     -> student.centerId            (1 hop)
 *   Session        -> group.centerId              (1 hop)
 *   GroupSchedule  -> group.centerId              (1 hop)
 *   Attendance     -> enrollment.student.centerId (2 hops)
 *   Payment        -> enrollment.student.centerId (2 hops)
 *   TeacherSalary  -> teacher.centerId            (1 hop)
 *
 * Student / Teacher / Group / Expense / User / Center have a direct
 * centerId column; their path is the empty array.
 */
const CENTER_RELATION_PATH = {
  Center: [],
  User: [],
  Student: [],
  Teacher: [],
  Group: [],
  Expense: [],
  Enrollment: ['student'],
  Session: ['group'],
  GroupSchedule: ['group'],
  Attendance: ['enrollment', 'student'],
  Payment: ['enrollment', 'student'],
  TeacherSalary: ['teacher'],
} as const satisfies Record<string, readonly string[]>;

export type ScopedModel = keyof typeof CENTER_RELATION_PATH;

/**
 * A Prisma `where` fragment. Typed loosely (per-model WhereInputs are not
 * structurally related in Prisma 7) but every shape produced here mirrors a
 * valid nested relation filter for the given model.
 */
export type CenterScopeFilter = Record<string, unknown>;

/**
 * Returns `{ centerId }` for direct-column models, or the nested relation
 * filter (e.g. `{ enrollment: { student: { centerId: X } } }`) for models
 * that inherit tenancy. Spread the result into your where clause:
 *
 *   prisma.payment.findMany({
 *     where: { ...applyCenterScope('Payment', centerId), paymentDate: { gte: start } },
 *   });
 *
 * Pass `null` for SUPERADMIN requests operating across all centers to get an
 * empty fragment (no scoping applied).
 */
export function applyCenterScope<M extends ScopedModel>(
  model: M,
  centerId: number | null,
): CenterScopeFilter {
  if (centerId === null) return {};

  const path = CENTER_RELATION_PATH[model];
  let filter: CenterScopeFilter = { centerId };
  for (let i = path.length - 1; i >= 0; i--) {
    filter = { [path[i] as string]: filter };
  }
  return filter;
}

/**
 * Service-layer guard mirroring tenant-guard's assertCenterScope, but
 * SUPERADMIN-aware: 'all'-scope actors pass any resource; 'center'-scope
 * actors must match. Responds with 404 so callers cannot probe existence.
 */
export function assertCanAccessCenter(
  actorScope: 'all' | 'center',
  actorCenterId: number | null,
  ownerCenterId: number,
): void {
  if (actorScope === 'all') return;
  if (actorCenterId !== ownerCenterId) {
    throw new AppError('Resource not found', 404);
  }
}
