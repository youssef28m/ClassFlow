import type { DayOfWeek, Prisma, Session } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface SessionFindManyParams {
  groupId?: number;
  scheduleId?: number;
  completed?: boolean;
  from?: Date;
  to?: Date;
  centerId: number | null;
  skip: number;
  take: number;
}

export interface SessionContext {
  id: number;
  groupId: number;
  scheduleId: number;
  group: { centerId: number };
  schedule: { dayOfWeek: DayOfWeek };
}

export class SessionRepository {
  findScheduleInGroup(scheduleId: number, groupId: number, centerId: number) {
    return prisma.groupSchedule.findFirst({
      where: { id: scheduleId, groupId, group: { centerId } },
      select: { id: true, dayOfWeek: true },
    });
  }

  create(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return prisma.session.create({ data });
  }

  findById(id: number, centerId: number): Promise<Session | null> {
    return prisma.session.findFirst({ where: { id, group: { centerId } } });
  }

  async complete(id: number, centerId: number): Promise<Session | null> {
    const result = await prisma.session.updateMany({
      where: { id, group: { centerId } },
      data: { completed: true },
    });
    if (result.count === 0) return null;
    return prisma.session.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.session.deleteMany({
      where: { id, group: { centerId } },
    });
    return result.count > 0;
  }

  findContext(id: number, centerId: number): Promise<SessionContext | null> {
    return prisma.session.findFirst({
      where: { id, group: { centerId } },
      select: {
        id: true,
        groupId: true,
        scheduleId: true,
        group: { select: { centerId: true } },
        schedule: { select: { dayOfWeek: true } },
      },
    });
  }

  async findMany(params: SessionFindManyParams): Promise<{ items: Session[]; total: number }> {
    const where: Prisma.SessionWhereInput = {
      group: params.centerId === null ? {} : { centerId: params.centerId },
    };
    if (params.groupId !== undefined) where.groupId = params.groupId;
    if (params.scheduleId !== undefined) where.scheduleId = params.scheduleId;
    if (params.completed !== undefined) where.completed = params.completed;
    if (params.from || params.to) {
      where.sessionDate = {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lte: params.to } : {}),
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.session.findMany({
        where,
        orderBy: { sessionDate: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.session.count({ where }),
    ]);
    return { items, total };
  }
}
