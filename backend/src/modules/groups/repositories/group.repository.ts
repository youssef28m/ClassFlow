import type { Group, PaymentType, Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface GroupFindManyParams {
  search?: string;
  teacherId?: number;
  paymentType?: PaymentType;
  centerId?: number | null;
  skip: number;
  take: number;
}

export class GroupRepository {
  create(data: Prisma.GroupUncheckedCreateInput): Promise<Group> {
    return prisma.group.create({ data });
  }

  findById(id: number, centerId: number): Promise<Group | null> {
    return prisma.group.findFirst({
      where: { id, centerId },
    });
  }

  async update(
    id: number,
    centerId: number,
    data: Prisma.GroupUncheckedUpdateInput,
  ): Promise<Group | null> {
    const result = await prisma.group.updateMany({ where: { id, centerId }, data });
    if (result.count === 0) {
      return null;
    }
    return prisma.group.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.group.deleteMany({ where: { id, centerId } });
    return result.count > 0;
  }

  async teacherExistsInCenter(teacherId: number, centerId: number): Promise<boolean> {
    const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, centerId } });
    return teacher !== null;
  }

  countActiveEnrollments(groupId: number): Promise<number> {
    return prisma.enrollment.count({ where: { groupId, active: true } });
  }

  async findMany(params: GroupFindManyParams): Promise<{ items: Group[]; total: number }> {
    const where: Prisma.GroupWhereInput = {};

    if (params.centerId !== null && params.centerId !== undefined) {
      where.centerId = params.centerId;
    }

    if (params.teacherId !== undefined) {
      where.teacherId = params.teacherId;
    }

    if (params.paymentType !== undefined) {
      where.paymentType = params.paymentType;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { subject: { contains: params.search, mode: 'insensitive' } },
        { room: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.group.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.group.count({ where }),
    ]);

    return { items, total };
  }
}
