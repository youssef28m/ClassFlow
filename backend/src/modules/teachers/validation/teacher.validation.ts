import { z } from 'zod';

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name is too long'),
  phone: z.string().trim().min(1, 'Phone is required').max(20, 'Phone is too long'),
  specialization: z.string().trim().min(1, 'Specialization is required').max(100, 'Specialization is too long'),
  active: z.boolean().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = createTeacherSchema.partial();

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

export const listTeachersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListTeachersQuery = z.infer<typeof listTeachersQuerySchema>;
