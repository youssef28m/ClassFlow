import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import {
  hashRefreshToken,
  parseDurationToMs,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt.service.js';

const OTHER_SECRET = 'not-the-env-secret-abcdefghijklmnopqrstuvwxyz012345';

describe('parseDurationToMs', () => {
  it('parses bare numbers as seconds', () => {
    expect(parseDurationToMs('5')).toBe(5_000);
  });

  it('parses duration suffixes', () => {
    expect(parseDurationToMs('30s')).toBe(30_000);
    expect(parseDurationToMs('10m')).toBe(600_000);
    expect(parseDurationToMs('2h')).toBe(7_200_000);
    expect(parseDurationToMs('7d')).toBe(7 * 86_400_000);
  });

  it('throws on invalid input', () => {
    expect(() => parseDurationToMs('abc')).toThrow();
    expect(() => parseDurationToMs('1w')).toThrow();
  });
});

describe('access token', () => {
  const authUser = { id: 42, role: 'ADMIN' as const, centerId: 3 };

  it('signs and verifies a token round-trip', () => {
    const token = signAccessToken(authUser);
    expect(verifyAccessToken(token)).toEqual({ sub: 42, role: 'ADMIN', centerId: 3 });
  });

  it('rejects a token signed with the wrong secret', () => {
    const forged = jwt.sign({ sub: 42, role: 'ADMIN', centerId: 3 }, OTHER_SECRET);
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('rejects a tampered payload', () => {
    const token = signAccessToken(authUser);
    const [header, payload] = token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      centerId: number;
    };
    const tampered = Buffer.from(JSON.stringify({ ...claims, centerId: 9 })).toString('base64url');
    expect(() => verifyAccessToken(`${header}.${tampered}`)).toThrow();
  });

  it('checks the intended issuer and audience', () => {
    const token = signAccessToken(authUser);
    const wrongAudience = jwt.sign({ sub: 42, role: 'ADMIN', centerId: 3 }, token, {
      algorithm: 'none',
    });
    expect(() => verifyAccessToken(wrongAudience)).toThrow();
  });

  it('exposes raw sub/role/centerId claims in the payload', () => {
    const token = signAccessToken({ id: 1, role: 'RECEPTIONIST', centerId: null });
    const rawPayload = Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8');
    const claims = JSON.parse(rawPayload) as {
      sub: number;
      role: string;
      centerId: number | null;
    };
    expect(claims.sub).toBe(1);
    expect(claims.role).toBe('RECEPTIONIST');
    expect(claims.centerId).toBeNull();
  });
});

describe('refresh token', () => {
  const authUser = { id: 7, role: 'MANAGER' as const, centerId: 1 };

  it('signs, verifies and reports a plannable expiry', () => {
    const { token, expiresAt } = signRefreshToken(authUser);
    const before = Date.now() + parseDurationToMs('30d') - 5_000;
    const after = Date.now() + parseDurationToMs('30d') + 5_000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after);

    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.jti).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a tampered refresh token', () => {
    const { token } = signRefreshToken(authUser);
    const parts = token.split('.');
    expect(() => verifyRefreshToken(`${parts[0]}.tampered.${parts[2]}`)).toThrow();
  });
});

describe('hashRefreshToken', () => {
  it('produces a stable sha256 hex digest', () => {
    const first = hashRefreshToken('token-abc');
    const second = hashRefreshToken('token-abc');
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRefreshToken('token-abc')).not.toBe(hashRefreshToken('token-abd'));
  });
});
