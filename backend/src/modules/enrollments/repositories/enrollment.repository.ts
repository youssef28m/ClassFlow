import type { Enrollment, Prisma, Student } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';
import type { EnrollmentWithRelations } from '../types/enrollment.types.js';
import { enrollmentDetailInclude, enrollmentInclude } from '../types/enrollment.types.js';

export interface EnrollData {
  studentId: number;
  groupId: number;
  enrollmentDate?: Date;
}

export interface EnrollmentFindManyParams {
  search?: string;
  studentId?: number;
  groupId?: number;
  active?: boolean;
  centerId?: number | null;
  skip: number;
  take: number;
}

export class EnrollmentRepository {
  findGroupInCenter(groupId: number, centerId: number) {
    return prisma.group.findFirst({
      where: { id: groupId, centerId },
      select: { id: true, maxStudents: true },
    });
  }

  findStudentInCenter(studentId: number, centerId: number): Promise<Student | null> {
    return prisma.student.findFirst({
      where: { id: studentId, centerId },
    });
  }

  findByStudentAndGroup(studentId: number, groupId: number): Promise<Enrollment | null> {
    return prisma.enrollment.findUnique({
      where: { studentId_groupId: { studentId, groupId } },
    });
  }

  async enroll(data: EnrollData, maxStudents: number): Promise<EnrollmentWithRelations | null> {
    return prisma.$transaction(async (tx) => {
      const activeCount = await tx.enrollment.count({
        where: { groupId: data.groupId, active: true },
      });
      if (activeCount >= maxStudents) {
        return null;
      }
      return tx.enrollment.create({ data, include: enrollmentInclude });
    });
  }

  async activate(id: number, groupId: number, maxStudents: number): Promise<EnrollmentWithRelations | null> {
    return prisma.$transaction(async (tx) => {
      const activeCount = await tx.enrollment.count({
        where: { groupId, active: true },
      });
      if (activeCount >= maxStudents) {
        return null;
      }
      await tx.enrollment.update({ where: { id }, data: { active: true } });
      return tx.enrollment.findUnique({
        where: { id },
        include: enrollmentInclude,
      });
    });
  }

  deactivate(id: number): Promise<EnrollmentWithRelations | null> {
    return prisma.enrollment.update({
      where: { id },
      data: { active: false },
      include: enrollmentInclude,
    });
  }

  updateDate(id: number, enrollmentDate: Date): Promise<EnrollmentWithRelations | null> {
    return prisma.enrollment.update({
      where: { id },
      data: { enrollmentDate },
      include: enrollmentInclude,
    });
  }

  async findByIdDetailed(id: number) {
    return prisma.enrollment.findUnique({
      where: { id },
      include: enrollmentDetailInclude,
    });
  }

  countPayments(enrollmentId: number): Promise<number> {
    return prisma.payment.count({ where: { enrollmentId } });
  }

  async delete(id: number): Promise<boolean> {
    const result = await prisma.enrollment.deleteMany({ where: { id } });
    return result.count > 0;
  }

  async findMany(params: EnrollmentFindManyParams): Promise<{ items: EnrollmentWithRelations[]; total: number }> {
    const where: Prisma.EnrollmentWhereInput = {};

    if (params.centerId !== null && params.centerId !== undefined) {
      where.student = { centerId: params.centerId };
    }

    if (params.studentId !== undefined) {
      where.studentId = params.studentId;
    }

    if (params.groupId !== undefined) {
      where.groupId = params.groupId;
    }

    if (params.active !== undefined) {
      where.active = params.active;
    }

    if (params.search) {
      where.student = {
        ...(where.student as Prisma.StudentWhereInput | undefined),
        fullName: { contains: params.search, mode: 'insensitive' },
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.enrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: enrollmentInclude,
      }),
      prisma.enrollment.count({ where }),
    ]);

    return { items, total };
  }
}
