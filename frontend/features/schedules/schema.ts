import { z } from "zod";
import { DAYS_OF_WEEK, type DayOfWeek, type Schedule } from "@/features/schedules/types";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

export const scheduleFormSchema = z.object({
  groupId: z.string().regex(/^\d+$/, "Group is required"),
  dayOfWeek: z.enum(DAYS_OF_WEEK),
  startTime: timeSchema,
  endTime: timeSchema,
}).refine((value) => value.startTime < value.endTime, { message: "End time must be after start time", path: ["endTime"] });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
export interface SchedulePayload { groupId: number; dayOfWeek: DayOfWeek; startTime: string; endTime: string; }
export type ScheduleUpdatePayload = Omit<SchedulePayload, "groupId">;

export function toSchedulePayload(values: ScheduleFormValues): SchedulePayload {
  return { groupId: Number(values.groupId), dayOfWeek: values.dayOfWeek, startTime: values.startTime, endTime: values.endTime };
}

function toTimeValue(value: string): string {
  const date = new Date(value);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

export function toScheduleFormValues(schedule: Schedule): ScheduleFormValues {
  return { groupId: String(schedule.groupId), dayOfWeek: schedule.dayOfWeek, startTime: toTimeValue(schedule.startTime), endTime: toTimeValue(schedule.endTime) };
}
