import { z } from 'zod';

const amountSchema = z
  .union([
    z.number().positive().max(99_999_999.99, 'Amount is too large'),
    z
      .string()
      .trim()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Amount must have up to 2 decimal places'),
  ])
  .refine((value) => Number(value) > 0, 'Amount must be greater than 0');

const percentageSchema = z
  .union([
    z.number().min(0.01).max(100),
    z
      .string()
      .trim()
      .regex(/^\d{1,3}(\.\d{1,2})?$/, 'Percentage must have up to 2 decimal places'),
  ])
  .refine((value) => Number(value) > 0 && Number(value) <= 100, 'Percentage must be between 0.01 and 100');

export const calculateSalarySchema = z.object({
  teacherId: z.coerce.number().int().positive().optional(),
  from: z.coerce.date(),
  to: z.coerce.date(),
  percentage: percentageSchema.default(70),
});

export type CalculateSalaryInput = z.infer<typeof calculateSalarySchema>;

export const paySalarySchema = z.object({
  teacherId: z.number().int().positive('Teacher id must be a positive integer'),
  from: z.coerce.date(),
  to: z.coerce.date(),
  percentage: percentageSchema,
  paymentDate: z.coerce.date(),
  notes: z.string().trim().max(500, 'Notes are too long').nullable().optional(),
});

export type PaySalaryInput = z.infer<typeof paySalarySchema>;

export const createSalarySchema = z.object({
  teacherId: z.number().int().positive('Teacher id must be a positive integer'),
  salaryMonth: z.number().int().min(1).max(12),
  salaryYear: z.number().int().min(2000).max(2100),
  amount: amountSchema,
  paymentSum: amountSchema,
  percentage: percentageSchema,
  paymentDate: z.coerce.date(),
  isPaid: z.boolean().optional(),
  notes: z.string().trim().max(500, 'Notes are too long').nullable().optional(),
});

export type CreateSalaryInput = z.infer<typeof createSalarySchema>;

export const updateSalarySchema = z.object({
  amount: amountSchema.optional(),
  paymentSum: amountSchema.optional(),
  percentage: percentageSchema.optional(),
  paymentDate: z.coerce.date().optional(),
  isPaid: z.boolean().optional(),
  notes: z.string().trim().max(500, 'Notes are too long').nullable().optional(),
});

export type UpdateSalaryInput = z.infer<typeof updateSalarySchema>;

export const listSalariesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  teacherId: z.coerce.number().int().positive().optional(),
  salaryMonth: z.coerce.number().int().min(1).max(12).optional(),
  salaryYear: z.coerce.number().int().min(2000).max(2100).optional(),
  isPaid: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListSalariesQuery = z.infer<typeof listSalariesQuerySchema>;
