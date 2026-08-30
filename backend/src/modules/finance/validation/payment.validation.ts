import { z } from 'zod';
import { PaymentMethod } from '../../../generated/prisma/client.js';

const amountSchema = z
  .union([
    z.number().positive().max(99_999_999.99, 'Amount is too large'),
    z
      .string()
      .trim()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Amount must have up to 2 decimal places'),
  ])
  .refine((value) => Number(value) > 0, 'Amount must be greater than 0');

const paymentDateSchema = z.coerce.date();

export const createPaymentSchema = z.object({
  enrollmentId: z.number().int().positive('Enrollment id must be a positive integer'),
  amount: amountSchema,
  paymentDate: paymentDateSchema,
  paymentMethod: z.enum(PaymentMethod),
  notes: z.string().trim().max(500, 'Notes are too long').nullable().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const updatePaymentSchema = z.object({
  amount: amountSchema.optional(),
  paymentDate: paymentDateSchema.optional(),
  paymentMethod: z.enum(PaymentMethod).optional(),
  notes: z.string().trim().max(500, 'Notes are too long').nullable().optional(),
});

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  enrollmentId: z.coerce.number().int().positive().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  paymentMethod: z.enum(PaymentMethod).optional(),
  from: paymentDateSchema.optional(),
  to: paymentDateSchema.optional(),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
