import type { DayOfWeek, GroupSchedule } from '../../../generated/prisma/client.js';

export interface ScheduleDTO {
  id: number;
  groupId: number;
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export function toScheduleDTO(schedule: GroupSchedule): ScheduleDTO {
  return {
    id: schedule.id,
    groupId: schedule.groupId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
  };
}
