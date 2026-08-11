import { createHash, randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import type { Role } from '../../../generated/prisma/client.js';

export interface AccessTokenPayload {
  sub: number;
  role: Role;
  centerId: number | null;
}

export interface RefreshTokenPayload {
  sub: number;
  jti: string;
}

export interface AuthToken {
  id: number;
  role: Role;
  centerId: number | null;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function parseDurationToMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = {
    s: MS_PER_SECOND,
    m: MS_PER_MINUTE,
    h: MS_PER_HOUR,
    d: MS_PER_DAY,
  };
  return amount * (multipliers[unit] ?? MS_PER_SECOND);
}

export function signAccessToken(user: AuthToken): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role, centerId: user.centerId };
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  if (typeof payload === 'string' || typeof payload.sub !== 'number') {
    throw new Error('Malformed access token payload');
  }
  return {
    sub: payload.sub,
    role: payload.role as Role,
    centerId: (payload.centerId as number | null) ?? null,
  };
}

export function signRefreshToken(user: AuthToken): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));
  const payload: RefreshTokenPayload = { sub: user.id, jti: randomUUID() };
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
  return { token, expiresAt };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  if (typeof payload === 'string' || typeof payload.sub !== 'number') {
    throw new Error('Malformed refresh token payload');
  }
  return { sub: payload.sub, jti: payload.jti as string };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
