import type { Prisma, TeacherSalary } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface SalaryFindManyParams {
  teacherId?: number;
  salaryMonth?: number;
  salaryYear?: number;
  isPaid?: boolean;
  centerId: number | null;
  skip: number;
  take: number;
}

export interface PaymentSumByTeacher {
  teacherId: number;
  teacherName: string;
  totalPayments: Prisma.Decimal;
}

export class SalaryRepository {
  findTeacherInCenter(teacherId: number, centerId: number) {
    return prisma.teacher.findFirst({ where: { id: teacherId, centerId }, select: { id: true } });
  }

  create(data: Prisma.TeacherSalaryUncheckedCreateInput): Promise<TeacherSalary> {
    return prisma.teacherSalary.create({ data });
  }

  findById(id: number, centerId: number): Promise<TeacherSalary | null> {
    return prisma.teacherSalary.findFirst({ where: { id, teacher: { centerId } } });
  }

  async update(
    id: number,
    centerId: number,
    data: Prisma.TeacherSalaryUncheckedUpdateInput,
  ): Promise<TeacherSalary | null> {
    const result = await prisma.teacherSalary.updateMany({
      where: { id, teacher: { centerId } },
      data,
    });
    if (result.count === 0) return null;
    return prisma.teacherSalary.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.teacherSalary.deleteMany({
      where: { id, teacher: { centerId } },
    });
    return result.count > 0;
  }

  async findMany(params: SalaryFindManyParams): Promise<{ items: TeacherSalary[]; total: number }> {
    const where: Prisma.TeacherSalaryWhereInput = {
      teacher: params.centerId === null ? {} : { centerId: params.centerId },
    };
    if (params.teacherId !== undefined) where.teacherId = params.teacherId;
    if (params.salaryMonth !== undefined) where.salaryMonth = params.salaryMonth;
    if (params.salaryYear !== undefined) where.salaryYear = params.salaryYear;
    if (params.isPaid !== undefined) where.isPaid = params.isPaid;

    const [items, total] = await prisma.$transaction([
      prisma.teacherSalary.findMany({
        where,
        orderBy: [{ salaryYear: 'desc' }, { salaryMonth: 'desc' }],
        skip: params.skip,
        take: params.take,
        include: { teacher: { select: { fullName: true } } },
      }),
      prisma.teacherSalary.count({ where }),
    ]);
    return { items, total };
  }

  async sumPaymentsByTeacher(
    centerId: number,
    from: Date,
    to: Date,
    teacherId?: number,
  ): Promise<PaymentSumByTeacher[]> {
    const results = await prisma.payment.groupBy({
      by: ['enrollmentId'],
      where: {
        enrollment: {
          active: true,
          student: { centerId },
          group: teacherId !== undefined ? { teacherId } : {},
        },
        paymentDate: { gte: from, lte: to },
      },
      _sum: { amount: true },
    });

    if (results.length === 0) return [];

    const enrollmentIds = results.map((r) => r.enrollmentId);
    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      select: {
        id: true,
        group: { select: { teacherId: true, teacher: { select: { fullName: true } } } },
      },
    });

    const enrollmentToTeacher = new Map<number, { teacherId: number; teacherName: string }>();
    for (const enrollment of enrollments) {
      enrollmentToTeacher.set(enrollment.id, {
        teacherId: enrollment.group.teacherId,
        teacherName: enrollment.group.teacher.fullName,
      });
    }

    const teacherSums = new Map<number, { teacherName: string; total: Prisma.Decimal }>();
    for (const result of results) {
      const info = enrollmentToTeacher.get(result.enrollmentId);
      if (!info) continue;
      const amount =
        result._sum.amount ??
        new (await import('../../../generated/prisma/client.js')).Prisma.Decimal(0);
      const existing = teacherSums.get(info.teacherId);
      if (existing) {
        existing.total = existing.total.add(amount);
      } else {
        teacherSums.set(info.teacherId, { teacherName: info.teacherName, total: amount });
      }
    }

    return [...teacherSums.entries()].map(([teacherId, { teacherName, total }]) => ({
      teacherId,
      teacherName,
      totalPayments: total,
    }));
  }

  findExisting(
    teacherId: number,
    salaryMonth: number,
    salaryYear: number,
  ): Promise<TeacherSalary | null> {
    return prisma.teacherSalary.findUnique({
      where: { teacherId_salaryMonth_salaryYear: { teacherId, salaryMonth, salaryYear } },
    });
  }

  findActiveTeachers(centerId: number): Promise<{ id: number; fullName: string }[]> {
    return prisma.teacher.findMany({
      where: { centerId, active: true },
      select: { id: true, fullName: true },
    });
  }

  deleteExpenseForSalary(salaryId: number): Promise<{ count: number }> {
    return prisma.expense.deleteMany({
      where: { description: { contains: `salary:${salaryId}` } },
    });
  }

  async getReportData(salaryId: number, centerId: number) {
    const salary = await prisma.teacherSalary.findFirst({
      where: { id: salaryId, teacher: { centerId } },
      include: { teacher: { select: { id: true, fullName: true } } },
    });
    if (!salary) return null;

    const from = new Date(Date.UTC(salary.salaryYear, salary.salaryMonth - 1, 1));
    const to = new Date(Date.UTC(salary.salaryYear, salary.salaryMonth, 0));

    const groups = await prisma.group.findMany({
      where: { teacherId: salary.teacherId, centerId },
      select: {
        id: true,
        name: true,
        subject: true,
        fee: true,
        enrollments: {
          where: { active: true },
          select: {
            id: true,
            student: {
              select: { id: true, fullName: true, grade: true, school: true },
            },
            payments: {
              where: { paymentDate: { gte: from, lte: to } },
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                paymentMethod: true,
              },
              orderBy: { paymentDate: 'asc' },
            },
          },
          orderBy: { student: { fullName: 'asc' } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { salary, groups, from, to };
  }
}
