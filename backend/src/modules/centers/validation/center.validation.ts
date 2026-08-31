import { z } from 'zod';
import { Role } from '../../../generated/prisma/client.js';

const centerUserRoles = [Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.RECEPTIONIST] as const;

export const createCenterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  address: z.string().trim().min(1, 'Address is required').max(200, 'Address is too long'),
  phone: z.string().trim().min(1, 'Phone is required').max(20, 'Phone is too long'),
  active: z.boolean().optional(),
});

export type CreateCenterInput = z.infer<typeof createCenterSchema>;

export const updateCenterSchema = createCenterSchema.partial();

export type UpdateCenterInput = z.infer<typeof updateCenterSchema>;

export const listCentersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export type ListCentersQuery = z.infer<typeof listCentersQuerySchema>;

export const createCenterUserSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
  role: z.enum(centerUserRoles),
});

export type CreateCenterUserInput = z.infer<typeof createCenterUserSchema>;
