import { z } from 'zod';

const sessionDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Session date must use YYYY-MM-DD format')
  .transform((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid session date');
    return date;
  });

export const createSessionSchema = z.object({
  groupId: z.number().int().positive('Group id must be a positive integer'),
  scheduleId: z.number().int().positive('Schedule id must be a positive integer'),
  sessionDate: sessionDateSchema,
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  groupId: z.coerce.number().int().positive().optional(),
  scheduleId: z.coerce.number().int().positive().optional(),
  completed: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  from: sessionDateSchema.optional(),
  to: sessionDateSchema.optional(),
});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

export const attendanceRecordSchema = z.object({
  enrollmentId: z.number().int().positive('Enrollment id must be a positive integer'),
  status: z.enum(['PRESENT', 'ABSENT']),
  notes: z.string().trim().max(500, 'Notes are too long').nullable().optional(),
});

export const recordAttendanceSchema = z.object({
  records: z.array(attendanceRecordSchema).max(500),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;

export const attendanceSummaryQuerySchema = z.object({
  groupId: z.coerce.number().int().positive('Group id must be a positive integer'),
});

export type AttendanceSummaryQuery = z.infer<typeof attendanceSummaryQuerySchema>;
