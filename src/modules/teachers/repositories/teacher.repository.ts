import type { Prisma, Teacher } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface TeacherFindManyParams {
  search?: string;
  active?: boolean;
  skip: number;
  take: number;
}

export class TeacherRepository {
  create(data: Prisma.TeacherUncheckedCreateInput): Promise<Teacher> {
    return prisma.teacher.create({ data });
  }

  findById(id: number): Promise<Teacher | null> {
    return prisma.teacher.findUnique({
      where: { id },
    });
  }

  update(id: number, data: Prisma.TeacherUncheckedUpdateInput): Promise<Teacher> {
    return prisma.teacher.update({
      where: { id },
      data,
    });
  }

  delete(id: number): Promise<Teacher> {
    return prisma.teacher.delete({
      where: { id },
    });
  }

  async findMany(params: TeacherFindManyParams): Promise<{ items: Teacher[]; total: number }> {
    const where: Prisma.TeacherWhereInput = {};

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { specialization: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.active !== undefined) {
      where.active = params.active;
    }

    const [items, total] = await prisma.$transaction([
      prisma.teacher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.teacher.count({ where }),
    ]);

    return { items, total };
  }
}
