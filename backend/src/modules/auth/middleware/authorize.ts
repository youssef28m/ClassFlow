import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('Forbidden: insufficient permissions', 403);
    }
    next();
  };
}
