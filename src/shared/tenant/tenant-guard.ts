import { AppError } from '../middleware/error-handler.js';

/**
 * Asserts that a resource owned by `ownerCenterId` is accessible to the
 * requesting `centerId`.
 *
 * Nested resources (Enrollment, GroupSchedule, Session, Attendance, Payment,
 * TeacherSalary) do not carry a `centerId` column; they inherit their center
 * from a parent (Group, Student, Teacher, Enrollment). Resolve the parent's
 * center first and pass it here before allowing read/write access, e.g.:
 *
 *   const enrollment = await prisma.enrollment.findFirst({
 *     where: { id },
 *     include: { student: { select: { centerId: true } } },
 *   });
 *   if (!enrollment) throw new AppError('Enrollment not found', 404);
 *   assertCenterScope(centerId, enrollment.student.centerId);
 *
 * Fails with 404 so callers cannot learn whether the resource exists.
 */
export function assertCenterScope(centerId: number, ownerCenterId: number): void {
  if (ownerCenterId !== centerId) {
    throw new AppError('Resource not found', 404);
  }
}
