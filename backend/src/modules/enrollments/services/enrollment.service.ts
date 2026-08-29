import { StudentStatus } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import { assertCenterScope } from '../../../shared/tenant/tenant-guard.js';
import type { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import type {
  EnrollmentDetail,
  EnrollmentDTO,
  EnrollmentWithRelations,
  PaginatedResponse,
} from '../types/enrollment.types.js';
import { toEnrollmentDTO } from '../types/enrollment.types.js';
import type {
  CreateEnrollmentInput,
  ListEnrollmentsQuery,
  UpdateEnrollmentDateInput,
  UpdateEnrollmentStatusInput,
} from '../validation/enrollment.validation.js';

type RouteId = string | string[] | undefined;

const ALREADY_ENROLLED_MESSAGE = 'Student is already enrolled in this group';
const GROUP_FULL_MESSAGE = 'Group is full';

export class EnrollmentService {
  constructor(private readonly repository: EnrollmentRepository) {}

  async create(input: CreateEnrollmentInput, centerId: number): Promise<EnrollmentDTO> {
    const group = await this.repository.findGroupInCenter(input.groupId, centerId);
    if (!group) {
      throw new AppError('Group not found in this center', 400);
    }

    const student = await this.repository.findStudentInCenter(input.studentId, centerId);
    if (!student) {
      throw new AppError('Student not found in this center', 400);
    }
    if (student.status !== StudentStatus.ACTIVE) {
      throw new AppError('Only active students can be enrolled', 400);
    }

    const existing = await this.repository.findByStudentAndGroup(input.studentId, input.groupId);
    if (existing?.active) {
      throw new AppError(ALREADY_ENROLLED_MESSAGE, 409);
    }

    if (existing) {
      const reactivated = await this.repository.activate(
        existing.id,
        input.groupId,
        group.maxStudents,
      );
      if (!reactivated) {
        throw new AppError(GROUP_FULL_MESSAGE, 400);
      }
      return toEnrollmentDTO(reactivated);
    }

    const enrollment = await this.repository.enroll(
      {
        studentId: input.studentId,
        groupId: input.groupId,
        enrollmentDate: input.enrollmentDate,
      },
      group.maxStudents,
    );
    if (!enrollment) {
      throw new AppError(GROUP_FULL_MESSAGE, 400);
    }
    return toEnrollmentDTO(enrollment);
  }

  async getById(id: RouteId, centerId: number): Promise<EnrollmentDTO> {
    const enrollment = await this.getOwnedEnrollment(this.parseId(id), centerId);
    return toEnrollmentDTO(enrollment);
  }

  async updateStatus(
    id: RouteId,
    centerId: number,
    input: UpdateEnrollmentStatusInput,
  ): Promise<EnrollmentDTO> {
    const current = await this.getOwnedEnrollment(this.parseId(id), centerId);

    if (input.active === current.active) {
      return toEnrollmentDTO(current);
    }

    let updated: EnrollmentWithRelations | null;
    if (input.active) {
      updated = await this.repository.activate(
        current.id,
        current.groupId,
        current.group.maxStudents,
      );
      if (!updated) {
        throw new AppError(GROUP_FULL_MESSAGE, 400);
      }
    } else {
      updated = await this.repository.deactivate(current.id);
    }

    if (!updated) {
      throw new AppError('Enrollment not found', 404);
    }
    return toEnrollmentDTO(updated);
  }

  async updateDate(
    id: RouteId,
    centerId: number,
    input: UpdateEnrollmentDateInput,
  ): Promise<EnrollmentDTO> {
    const current = await this.getOwnedEnrollment(this.parseId(id), centerId);
    const updated = await this.repository.updateDate(current.id, input.enrollmentDate);
    if (!updated) {
      throw new AppError('Enrollment not found', 404);
    }
    return toEnrollmentDTO(updated);
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const enrollment = await this.getOwnedEnrollment(this.parseId(id), centerId);

    const paymentCount = await this.repository.countPayments(enrollment.id);
    if (paymentCount > 0) {
      throw new AppError(
        'Cannot delete an enrollment with recorded payments; deactivate it instead',
        409,
      );
    }

    const deleted = await this.repository.delete(enrollment.id);
    if (!deleted) {
      throw new AppError('Enrollment not found', 404);
    }
  }

  async list(
    query: ListEnrollmentsQuery,
    centerId: number | null,
  ): Promise<PaginatedResponse<EnrollmentDTO>> {
    const { page, pageSize, studentId, groupId, active } = query;
    const { items, total } = await this.repository.findMany({
      studentId,
      groupId,
      active,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(toEnrollmentDTO),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private async getOwnedEnrollment(id: number, centerId: number): Promise<EnrollmentDetail> {
    const enrollment = await this.repository.findByIdDetailed(id);
    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }
    assertCenterScope(centerId, enrollment.student.centerId);
    assertCenterScope(centerId, enrollment.group.centerId);
    return enrollment;
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') {
      throw new AppError('Invalid enrollment id', 400);
    }
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid enrollment id', 400);
    }
    return parsed;
  }
}
