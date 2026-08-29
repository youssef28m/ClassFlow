import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  studentId: z.number().int().positive('Student id must be a positive integer'),
  groupId: z.number().int().positive('Group id must be a positive integer'),
  enrollmentDate: z.coerce.date().optional(),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentStatusSchema = z.object({
  active: z.boolean(),
});

export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;

export const updateEnrollmentDateSchema = z.object({
  enrollmentDate: z.coerce.date(),
});

export type UpdateEnrollmentDateInput = z.infer<typeof updateEnrollmentDateSchema>;

export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  studentId: z.coerce.number().int().positive().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
