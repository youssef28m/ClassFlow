import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../shared/middleware/error-handler.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { type AccessTokenPayload, verifyAccessToken } from '../services/jwt.service.js';

const repository = new AuthRepository();

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Missing bearer token', 401);
  }

  const token = header.slice('Bearer '.length).trim();
  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await repository.findById(payload.sub);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = {
    id: user.id,
    username: user.username,
    role: user.role,
  };
  next();
}
