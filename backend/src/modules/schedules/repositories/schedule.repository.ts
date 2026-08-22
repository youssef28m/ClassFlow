import type { DayOfWeek, GroupSchedule, Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface ScheduleFindManyParams {
  groupId?: number;
  dayOfWeek?: DayOfWeek;
  centerId: number | null;
  skip: number;
  take: number;
}

export class ScheduleRepository {
  create(data: Prisma.GroupScheduleUncheckedCreateInput): Promise<GroupSchedule> {
    return prisma.groupSchedule.create({ data });
  }

  findById(id: number, centerId: number): Promise<GroupSchedule | null> {
    return prisma.groupSchedule.findFirst({
      where: { id, group: { centerId } },
    });
  }

  findGroupInCenter(groupId: number, centerId: number): Promise<{ id: number } | null> {
    return prisma.group.findFirst({ where: { id: groupId, centerId }, select: { id: true } });
  }

  async update(
    id: number,
    centerId: number,
    data: Prisma.GroupScheduleUncheckedUpdateInput,
  ): Promise<GroupSchedule | null> {
    const result = await prisma.groupSchedule.updateMany({
      where: { id, group: { centerId } },
      data,
    });
    if (result.count === 0) return null;
    return prisma.groupSchedule.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.groupSchedule.deleteMany({
      where: { id, group: { centerId } },
    });
    return result.count > 0;
  }

  countSessions(id: number): Promise<number> {
    return prisma.session.count({ where: { scheduleId: id } });
  }

  async findMany(
    params: ScheduleFindManyParams,
  ): Promise<{ items: GroupSchedule[]; total: number }> {
    const where: Prisma.GroupScheduleWhereInput = {
      group: {
        ...(params.centerId === null ? {} : { centerId: params.centerId }),
      },
    };
    if (params.groupId !== undefined) where.groupId = params.groupId;
    if (params.dayOfWeek !== undefined) where.dayOfWeek = params.dayOfWeek;

    const [items, total] = await prisma.$transaction([
      prisma.groupSchedule.findMany({
        where,
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.groupSchedule.count({ where }),
    ]);
    return { items, total };
  }
}
