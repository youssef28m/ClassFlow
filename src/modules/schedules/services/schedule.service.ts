import { Prisma } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { ScheduleRepository } from '../repositories/schedule.repository.js';
import type { PaginatedResponse, ScheduleDTO } from '../types/schedule.types.js';
import { toScheduleDTO } from '../types/schedule.types.js';
import type {
  CreateScheduleInput,
  ListSchedulesQuery,
  UpdateScheduleInput,
} from '../validation/schedule.validation.js';

type RouteId = string | string[] | undefined;

export class ScheduleService {
  constructor(private readonly repository: ScheduleRepository) {}

  async create(input: CreateScheduleInput, centerId: number): Promise<ScheduleDTO> {
    await this.ensureGroup(input.groupId, centerId);
    try {
      return toScheduleDTO(await this.repository.create(input));
    } catch (error) {
      this.handleDuplicate(error);
      throw error;
    }
  }

  async getById(id: RouteId, centerId: number): Promise<ScheduleDTO> {
    const schedule = await this.repository.findById(this.parseId(id), centerId);
    if (!schedule) throw new AppError('Schedule not found', 404);
    return toScheduleDTO(schedule);
  }

  async update(id: RouteId, centerId: number, input: UpdateScheduleInput): Promise<ScheduleDTO> {
    const scheduleId = this.parseId(id);
    const current = await this.repository.findById(scheduleId, centerId);
    if (!current) throw new AppError('Schedule not found', 404);

    const data = {
      ...input,
      startTime: input.startTime ?? current.startTime,
      endTime: input.endTime ?? current.endTime,
    };
    if (data.startTime >= data.endTime) {
      throw new AppError('End time must be after start time', 400);
    }

    try {
      const updated = await this.repository.update(scheduleId, centerId, data);
      if (!updated) throw new AppError('Schedule not found', 404);
      return toScheduleDTO(updated);
    } catch (error) {
      this.handleDuplicate(error);
      throw error;
    }
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const scheduleId = this.parseId(id);
    const schedule = await this.repository.findById(scheduleId, centerId);
    if (!schedule) throw new AppError('Schedule not found', 404);
    if (await this.repository.countSessions(scheduleId)) {
      throw new AppError('Cannot delete a schedule with recorded sessions', 409);
    }
    if (!(await this.repository.delete(scheduleId, centerId))) {
      throw new AppError('Schedule not found', 404);
    }
  }

  async list(
    query: ListSchedulesQuery,
    centerId: number | null,
  ): Promise<PaginatedResponse<ScheduleDTO>> {
    const { page, pageSize, groupId, dayOfWeek } = query;
    const { items, total } = await this.repository.findMany({
      groupId,
      dayOfWeek,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(toScheduleDTO),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private async ensureGroup(groupId: number, centerId: number): Promise<void> {
    if (!(await this.repository.findGroupInCenter(groupId, centerId))) {
      throw new AppError('Group not found in this center', 400);
    }
  }

  private handleDuplicate(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('This schedule already exists for the group', 409);
    }
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') throw new AppError('Invalid schedule id', 400);
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError('Invalid schedule id', 400);
    return parsed;
  }
}
