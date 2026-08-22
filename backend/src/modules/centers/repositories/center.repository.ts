import type { Center, Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface CenterFindManyParams {
  search?: string;
  active?: boolean;
  id?: number;
  skip: number;
  take: number;
}

export class CenterRepository {
  create(data: Prisma.CenterUncheckedCreateInput): Promise<Center> {
    return prisma.center.create({ data });
  }

  findById(id: number): Promise<Center | null> {
    return prisma.center.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Prisma.CenterUncheckedUpdateInput): Promise<Center | null> {
    const result = await prisma.center.updateMany({ where: { id }, data });
    if (result.count === 0) {
      return null;
    }
    return prisma.center.findUniqueOrThrow({ where: { id } });
  }

  async findMany(params: CenterFindManyParams): Promise<{ items: Center[]; total: number }> {
    const where: Prisma.CenterWhereInput = {};

    if (params.id !== undefined) {
      where.id = params.id;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.active !== undefined) {
      where.active = params.active;
    }

    const [items, total] = await prisma.$transaction([
      prisma.center.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.center.count({ where }),
    ]);

    return { items, total };
  }
}
