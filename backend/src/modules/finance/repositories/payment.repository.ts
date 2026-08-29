import type { Payment, PaymentMethod, Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface PaymentFindManyParams {
  enrollmentId?: number;
  groupId?: number;
  paymentMethod?: PaymentMethod;
  from?: Date;
  to?: Date;
  centerId: number | null;
  skip: number;
  take: number;
}

export class PaymentRepository {
  findActiveEnrollmentInCenter(enrollmentId: number, centerId: number) {
    return prisma.enrollment.findFirst({
      where: { id: enrollmentId, active: true, student: { centerId }, group: { centerId } },
      select: { id: true },
    });
  }

  create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return prisma.payment.create({ data });
  }

  findStudentInCenter(studentId: number, centerId: number) {
    return prisma.student.findFirst({
      where: { id: studentId, centerId },
      select: {
        id: true,
        fullName: true,
        grade: true,
        school: true,
        phone: true,
        parentPhone: true,
        joinDate: true,
        status: true,
      },
    });
  }

  findEnrollmentsWithGroupForStudent(studentId: number) {
    return prisma.enrollment.findMany({
      where: { studentId },
      orderBy: [{ active: 'desc' }, { id: 'asc' }],
      include: {
        group: { select: { id: true, name: true, subject: true, fee: true, paymentType: true } },
      },
    });
  }

  findPaymentsForStudent(studentId: number) {
    return prisma.payment.findMany({
      where: { enrollment: { studentId } },
      orderBy: { paymentDate: 'desc' },
      select: { enrollmentId: true, amount: true, paymentDate: true },
    });
  }

  findById(
    id: number,
    centerId: number,
  ): Promise<
    | (Payment & {
        enrollment: {
          student: { id: number; fullName: string };
          group: { id: number; name: string };
        };
      })
    | null
  > {
    return prisma.payment.findFirst({
      where: { id, enrollment: { student: { centerId } } },
      include: {
        enrollment: {
          select: {
            student: { select: { id: true, fullName: true } },
            group: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async update(
    id: number,
    centerId: number,
    data: Prisma.PaymentUncheckedUpdateInput,
  ): Promise<Payment | null> {
    const result = await prisma.payment.updateMany({
      where: { id, enrollment: { student: { centerId } } },
      data,
    });
    if (result.count === 0) return null;
    return prisma.payment.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.payment.deleteMany({
      where: { id, enrollment: { student: { centerId } } },
    });
    return result.count > 0;
  }

  async findMany(params: PaymentFindManyParams): Promise<{ items: Payment[]; total: number }> {
    const where: Prisma.PaymentWhereInput = {
      enrollment: params.centerId === null ? {} : { student: { centerId: params.centerId } },
    };
    if (params.enrollmentId !== undefined) where.enrollmentId = params.enrollmentId;
    if (params.groupId !== undefined)
      where.enrollment = {
        ...(where.enrollment as Prisma.EnrollmentWhereInput),
        groupId: params.groupId,
      };
    if (params.paymentMethod !== undefined) where.paymentMethod = params.paymentMethod;
    if (params.from || params.to) {
      where.paymentDate = {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lte: params.to } : {}),
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: params.skip,
        take: params.take,
        include: {
          enrollment: {
            select: {
              student: { select: { id: true, fullName: true } },
              group: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    return { items, total };
  }
}
