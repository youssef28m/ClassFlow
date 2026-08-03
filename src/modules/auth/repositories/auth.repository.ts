import type { Role, User } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export class AuthRepository {
  findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  create(data: { username: string; passwordHash: string; role: Role }): Promise<User> {
    return prisma.user.create({ data });
  }
}
