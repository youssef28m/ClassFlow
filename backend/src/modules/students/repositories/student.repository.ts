import type { Prisma, Student, StudentStatus } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface StudentFindManyParams {
  search?: string;
  status?: StudentStatus;
  grade?: string;
  centerId?: number | null;
  skip: number;
  take: number;
}

export class StudentRepository {
  create(data: Prisma.StudentUncheckedCreateInput): Promise<Student> {
    return prisma.student.create({ data });
  }

  findById(id: number, centerId: number): Promise<Student | null> {
    return prisma.student.findFirst({
      where: { id, centerId },
    });
  }

  findDuplicate(centerId: number, fullName: string, phone: string): Promise<Student | null> {
    return prisma.student.findFirst({
      where: { centerId, fullName, phone },
    });
  }

  findDuplicateByNameAndGrade(centerId: number, fullName: string, grade: string): Promise<Student | null> {
    return prisma.student.findFirst({
      where: {
        centerId,
        fullName: { equals: fullName, mode: 'insensitive' },
        grade: { equals: grade, mode: 'insensitive' },
      },
    });
  }

  async update(id: number, centerId: number, data: Prisma.StudentUncheckedUpdateInput): Promise<Student | null> {
    const result = await prisma.student.updateMany({ where: { id, centerId }, data });
    if (result.count === 0) {
      return null;
    }
    return prisma.student.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.student.deleteMany({ where: { id, centerId } });
    return result.count > 0;
  }

  async findMany(params: StudentFindManyParams): Promise<{ items: Student[]; total: number }> {
    const where: Prisma.StudentWhereInput = {};

    if (params.centerId !== null && params.centerId !== undefined) {
      where.centerId = params.centerId;
    }

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { parentPhone: { contains: params.search, mode: 'insensitive' } },
        { school: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.grade) {
      where.grade = { equals: params.grade, mode: 'insensitive' };
    }

    const [items, total] = await prisma.$transaction([
      prisma.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.student.count({ where }),
    ]);

    return { items, total };
  }

  async findDistinctGrades(centerId: number | null): Promise<string[]> {
    const rows = await prisma.student.findMany({
      where: centerId === null || centerId === undefined ? {} : { centerId },
      select: { grade: true },
      distinct: ['grade'],
      orderBy: { grade: 'asc' },
    });
    return rows.map((row) => row.grade);
  }
}
