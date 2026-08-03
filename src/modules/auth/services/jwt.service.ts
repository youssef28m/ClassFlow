import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import type { Role } from '../../../generated/prisma/client.js';

export interface AccessTokenPayload {
  sub: number;
  role: Role;
}

export interface AuthToken {
  id: number;
  role: Role;
}

export function signAccessToken(user: AuthToken): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role };
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
  return { sub: payload.sub, role: payload.role as Role };
}
