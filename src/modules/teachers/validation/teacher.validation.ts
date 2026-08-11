import { z } from 'zod';

export const salarySchema = z
  .union([
    z.number().positive().max(99_999_999.99, 'Salary is too large'),
    z
      .string()
      .trim()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Salary must be an amount with up to 2 decimal places'),
  ])
  .refine((value) => Number(value) > 0, 'Salary must be greater than 0');

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name is too long'),
  phone: z.string().trim().min(1, 'Phone is required').max(20, 'Phone is too long'),
  specialization: z
    .string()
    .trim()
    .min(1, 'Specialization is required')
    .max(100, 'Specialization is too long'),
  salary: salarySchema,
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
