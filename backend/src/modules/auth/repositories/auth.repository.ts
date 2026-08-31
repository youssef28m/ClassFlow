import type { Center, RefreshToken, Role, User } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export type UserWithCenter = User & { center: Center | null };

export class AuthRepository {
  findByUsername(username: string, centerId?: number): Promise<UserWithCenter | null> {
    return prisma.user.findFirst({
      where: { username, ...(centerId !== undefined ? { centerId } : {}) },
      include: { center: true },
    });
  }

  findById(id: number): Promise<UserWithCenter | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { center: true },
    });
  }

  create(data: { username: string; passwordHash: string; role: Role; centerId: number }): Promise<User> {
    return prisma.user.create({ data });
  }

  async findFirstActiveCenterId(): Promise<number | null> {
    const center = await prisma.center.findFirst({
      where: { active: true },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return center?.id ?? null;
  }

  createRefreshToken(data: { tokenHash: string; userId: number; expiresAt: Date }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshToken(tokenHash: string, userId?: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, ...(userId ? { userId } : {}) },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
