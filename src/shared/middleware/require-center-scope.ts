import type { NextFunction, Request, Response } from 'express';
import { Role } from '../../generated/prisma/client.js';
import { AppError } from './error-handler.js';

/**
 * Resolves the effective center scope for a request.
 *
 * Non-SUPERADMIN users are hard-locked to the center carried on their token
 * (`req.centerId`, set by `authenticate`). SUPERADMINs (whose token has no
 * center) may optionally pass `?centerId=<id>` to target a specific center,
 * or leave it absent to operate across all centers.
 *
 * Never trust a `centerId` supplied by the client for non-SUPERADMIN users.
 */
export function requireCenterScope(req: Request, _res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    throw new AppError('Unauthorized', 401);
  }

  if (user.role !== Role.SUPERADMIN) {
    if (user.centerId === null || user.centerId === undefined) {
      throw new AppError('User is not associated with a center', 403);
    }
    req.centerId = user.centerId;
    next();
    return;
  }

  const raw = req.query.centerId;
  if (raw === undefined) {
    req.centerId = null;
    next();
    return;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError('Invalid centerId', 400);
  }
  req.centerId = parsed;
  next();
}

/**
 * Ensures the request has a concrete center to act against. Required for
 * writes and for by-id reads, where SUPERADMINs must specify a `centerId`
 * query parameter instead of operating across all centers.
 */
export function requireResolvedCenterId(req: Request, _res: Response, next: NextFunction): void {
  if (req.centerId === null || req.centerId === undefined) {
    throw new AppError('A centerId is required for this operation', 400);
  }
  next();
}

export function mustGetCenterId(req: Request): number {
  if (req.centerId === null || req.centerId === undefined) {
    throw new AppError('A centerId is required for this operation', 400);
  }
  return req.centerId;
}
