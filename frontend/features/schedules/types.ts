export const DAY_OF_WEEK = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

export const DAYS_OF_WEEK = DAY_OF_WEEK;

export type DayOfWeek = (typeof DAY_OF_WEEK)[number];

export interface Schedule {
  id: number;
  groupId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ScheduleListResponse {
  items: Schedule[];
  meta: PaginationMeta;
}

export interface ScheduleFilters {
  page?: number;
  pageSize?: number;
  groupId?: number;
  dayOfWeek?: DayOfWeek;
}
