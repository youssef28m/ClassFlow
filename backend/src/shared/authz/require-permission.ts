import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../middleware/error-handler.js';
import { type ActionsOf, can, type Resource } from './permissions.js';

/**
 * Route-level authorization middleware. Assumes `authenticate` has already
 * run and attached `req.user`; performs no token logic of its own.
 *
 * Usage:
 *   router.post('/', requirePermission('students', 'create'), controller.create);
 *
 * Fails closed with 403. For SUPERADMIN, `can()` grants everything, matching
 * the matrix's "Full (All)".
 */
export function requirePermission<R extends Resource>(resource: R, action: ActionsOf<R>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }
    if (!can(user, resource, action)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }
    next();
  };
}

/**
 * A validated (resource, action) pair: the action must belong to the named
 * resource's vocabulary, enforced structurally by distributing the mapped
 * type over the Resource union.
 */
export type PermissionCheck = {
  [R in Resource]: { resource: R; action: ActionsOf<R> };
}[Resource];

export function requireAnyPermission(...permissions: PermissionCheck[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }
    if (!permissions.some(({ resource, action }) => can(user, resource, action as ActionsOf<typeof resource>))) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }
    next();
  };
}
