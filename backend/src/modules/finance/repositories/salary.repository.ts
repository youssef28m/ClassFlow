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
      }),
      prisma.teacherSalary.count({ where }),
    ]);
    return { items, total };
  }
}
