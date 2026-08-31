import { z } from 'zod';
import { Role } from '../../../generated/prisma/client.js';

const userRoleSchema = z.enum(Role);

export const createUserSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long').optional(),
  role: userRoleSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  role: userRoleSchema.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
