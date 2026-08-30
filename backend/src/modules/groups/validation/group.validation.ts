import { z } from 'zod';
import { PaymentType } from '../../../generated/prisma/client.js';

export const feeSchema = z
  .union([
    z.number().positive().max(99_999_999.99, 'Fee is too large'),
    z
      .string()
      .trim()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Fee must be an amount with up to 2 decimal places'),
  ])
  .refine((value) => Number(value) > 0, 'Fee must be greater than 0');

export const billingAnchorDaySchema = z
  .number()
  .int('Billing anchor day must be an integer')
  .min(1, 'Billing anchor day must be between 1 and 28')
  .max(28, 'Billing anchor day must be between 1 and 28');

export const createGroupSchema = z.object({
  teacherId: z.number().int().positive('Teacher id must be a positive integer'),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  subject: z.string().trim().min(1, 'Subject is required').max(100, 'Subject is too long'),
  room: z.string().trim().min(1, 'Room is required').max(50, 'Room is too long'),
  fee: feeSchema,
  paymentType: z.enum(PaymentType),
  maxStudents: z
    .number()
    .int('Max students must be an integer')
    .min(1, 'Max students must be at least 1')
    .max(500, 'Max students is too large'),
  billingAnchorDay: billingAnchorDaySchema.default(1),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = createGroupSchema.partial();

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const listGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  teacherId: z.coerce.number().int().positive().optional(),
  paymentType: z.enum(PaymentType).optional(),
});

export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;

export const groupPaymentReportQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type GroupPaymentReportQuery = z.infer<typeof groupPaymentReportQuerySchema>;
