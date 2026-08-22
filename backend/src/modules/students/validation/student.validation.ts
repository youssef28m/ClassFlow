import { z } from 'zod';
import { StudentStatus } from '../../../generated/prisma/client.js';

const nullableString = (max: number) => z.string().trim().max(max).nullable().optional();

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name is too long'),
  phone: nullableString(20),
  parentPhone: nullableString(20),
  grade: z.string().trim().min(1, 'Grade is required').max(50, 'Grade is too long'),
  school: nullableString(100),
  address: z.string().trim().min(1, 'Address is required').max(200, 'Address is too long'),
  joinDate: z.coerce.date(),
  status: z.nativeEnum(StudentStatus).optional(),
  notes: nullableString(500),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema.partial();

export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  status: z.nativeEnum(StudentStatus).optional(),
});

export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
