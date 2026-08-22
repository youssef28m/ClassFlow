import { z } from 'zod';
import { ExpenseCategory } from '../../../generated/prisma/client.js';

const amountSchema = z
  .union([
    z.number().positive().max(99_999_999.99, 'Amount is too large'),
    z
      .string()
      .trim()
      .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Amount must have up to 2 decimal places'),
  ])
  .refine((value) => Number(value) > 0, 'Amount must be greater than 0');

export const createExpenseSchema = z.object({
  category: z.enum(ExpenseCategory),
  amount: amountSchema,
  expenseDate: z.coerce.date(),
  description: z.string().trim().max(500, 'Description is too long').nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  category: z.enum(ExpenseCategory).optional(),
  amount: amountSchema.optional(),
  expenseDate: z.coerce.date().optional(),
  description: z.string().trim().max(500, 'Description is too long').nullable().optional(),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  category: z.enum(ExpenseCategory).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
