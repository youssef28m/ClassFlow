import type { Prisma, Teacher } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface TeacherFindManyParams {
  search?: string;
  active?: boolean;
  centerId?: number | null;
  skip: number;
  take: number;
}

export class TeacherRepository {
  create(data: Prisma.TeacherUncheckedCreateInput): Promise<Teacher> {
    return prisma.teacher.create({ data });
  }

  findById(id: number, centerId: number): Promise<Teacher | null> {
    return prisma.teacher.findFirst({
      where: { id, centerId },
    });
  }

  async update(id: number, centerId: number, data: Prisma.TeacherUncheckedUpdateInput): Promise<Teacher | null> {
    const result = await prisma.teacher.updateMany({ where: { id, centerId }, data });
    if (result.count === 0) {
      return null;
    }
    return prisma.teacher.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.teacher.deleteMany({ where: { id, centerId } });
    return result.count > 0;
  }

  async findMany(params: TeacherFindManyParams): Promise<{ items: Teacher[]; total: number }> {
    const where: Prisma.TeacherWhereInput = {};

    if (params.centerId !== null && params.centerId !== undefined) {
      where.centerId = params.centerId;
    }

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
