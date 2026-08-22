import type { CookieOptions, Response } from 'express';
import { env } from '../../../config/env.js';
import { parseDurationToMs } from './jwt.service.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

function buildCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, buildCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
}
