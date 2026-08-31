import { z } from 'zod';
import { DayOfWeek } from '../../../generated/prisma/client.js';

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm format')
  .transform((value) => {
    const [hours, minutes] = value.split(':').map(Number);
    return new Date(Date.UTC(1970, 0, 1, hours, minutes));
  });

export const createScheduleSchema = z
  .object({
    groupId: z.number().int().positive('Group id must be a positive integer'),
    dayOfWeek: z.enum(DayOfWeek),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((value) => value.startTime < value.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z
  .object({
    dayOfWeek: z.enum(DayOfWeek).optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
  })
  .refine((value) => value.startTime === undefined || value.endTime === undefined || value.startTime < value.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const listSchedulesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  groupId: z.coerce.number().int().positive().optional(),
  dayOfWeek: z.enum(DayOfWeek).optional(),
});

export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;
