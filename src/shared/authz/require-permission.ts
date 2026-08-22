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

export function requireAnyPermission(
    ...permissions: Array<{ resource: Resource; action: string }>
) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = req.user;
        if (!user) {
            throw new AppError('Unauthorized', 401);
        }
        if (
            !permissions.some(({ resource, action }) =>
                can(user, resource, action as ActionsOf<typeof resource>),
            )
        ) {
            throw new AppError('Forbidden: insufficient permissions', 403);
        }
        next();
    };
}
