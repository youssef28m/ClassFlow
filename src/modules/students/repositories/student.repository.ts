import type { Prisma, Student, StudentStatus } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface StudentFindManyParams {
  search?: string;
  status?: StudentStatus;
  skip: number;
  take: number;
}

export class StudentRepository {
  create(data: Prisma.StudentUncheckedCreateInput): Promise<Student> {
    return prisma.student.create({ data });
  }

  findById(id: number): Promise<Student | null> {
    return prisma.student.findUnique({
      where: { id },
    });
  }

  update(id: number, data: Prisma.StudentUncheckedUpdateInput): Promise<Student> {
    return prisma.student.update({
      where: { id },
      data,
    });
  }

  delete(id: number): Promise<Student> {
    return prisma.student.delete({
      where: { id },
    });
  }

  async findMany(params: StudentFindManyParams): Promise<{ items: Student[]; total: number }> {
    const where: Prisma.StudentWhereInput = {};

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
}
