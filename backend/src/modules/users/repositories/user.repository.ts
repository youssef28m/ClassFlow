import type { Prisma, Role, User } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface UserFindManyParams {
  search?: string;
  role?: Role;
  centerId?: number | null;
  skip: number;
  take: number;
}

export class UserRepository {
  create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  findById(id: number, centerId: number): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, centerId } });
  }

  findByUsername(username: string, centerId: number): Promise<User | null> {
    return prisma.user.findFirst({ where: { username, centerId } });
  }

  async update(
    id: number,
    centerId: number,
    data: Prisma.UserUncheckedUpdateInput,
  ): Promise<User | null> {
    const result = await prisma.user.updateMany({ where: { id, centerId }, data });
    if (result.count === 0) {
      return null;
    }
    return prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.user.deleteMany({ where: { id, centerId } });
    return result.count > 0;
  }

  async findMany(params: UserFindManyParams): Promise<{ items: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {};

    if (params.centerId !== null && params.centerId !== undefined) {
      where.centerId = params.centerId;
    }

    if (params.search) {
      where.username = { contains: params.search, mode: 'insensitive' };
    }

    if (params.role !== undefined) {
      where.role = params.role;
    }

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        include: { center: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  }
}
