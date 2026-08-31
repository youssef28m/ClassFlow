import { Prisma } from '../../../generated/prisma/client.js';
import { canManageUserAccount } from '../../../shared/authz/permissions.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import { hashPassword } from '../../auth/services/password.service.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { PaginatedResponse, UserDTO } from '../types/user.types.js';
import { toUserDTO } from '../types/user.types.js';
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from '../validation/user.validation.js';

type RouteId = string | string[] | undefined;

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(input: CreateUserInput, centerId: number, actor: AuthUser): Promise<UserDTO> {
    this.assertCanManageRole(actor, input.role);
    await this.assertUsernameAvailable(input.username, centerId);

    try {
      const user = await this.repository.create({
        username: input.username,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        centerId,
      });
      return toUserDTO(user);
    } catch (error) {
      this.handleDuplicateUsername(error);
      throw error;
    }
  }

  async getById(id: RouteId, centerId: number): Promise<UserDTO> {
    const user = await this.repository.findById(this.parseId(id), centerId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return toUserDTO(user);
  }

  async update(id: RouteId, centerId: number, input: UpdateUserInput, actor: AuthUser): Promise<UserDTO> {
    const userId = this.parseId(id);
    const currentUser = await this.repository.findById(userId, centerId);
    if (!currentUser) {
      throw new AppError('User not found', 404);
    }

    this.assertCanManageRole(actor, input.role ?? currentUser.role);

    if (input.username !== undefined && input.username !== currentUser.username) {
      await this.assertUsernameAvailable(input.username, centerId, userId);
    }

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (input.username !== undefined) data.username = input.username;
    if (input.role !== undefined) data.role = input.role;
    if (input.password !== undefined) data.passwordHash = await hashPassword(input.password);

    try {
      const user = await this.repository.update(userId, centerId, data);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return toUserDTO(user);
    } catch (error) {
      this.handleDuplicateUsername(error);
      throw error;
    }
  }

  async delete(id: RouteId, centerId: number, actor: AuthUser): Promise<void> {
    const userId = this.parseId(id);
    if (userId === actor.id) {
      throw new AppError('You cannot delete your own account', 400);
    }

    const user = await this.repository.findById(userId, centerId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    this.assertCanManageRole(actor, user.role);

    const deleted = await this.repository.delete(userId, centerId);
    if (!deleted) {
      throw new AppError('User not found', 404);
    }
  }

  async list(query: ListUsersQuery, centerId: number | null): Promise<PaginatedResponse<UserDTO>> {
    const { page, pageSize, search, role } = query;
    const { items, total } = await this.repository.findMany({
      search,
      role,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(toUserDTO),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private async assertUsernameAvailable(username: string, centerId: number, excludedUserId?: number): Promise<void> {
    const existing = await this.repository.findByUsername(username, centerId);
    if (existing && existing.id !== excludedUserId) {
      throw new AppError('Username is already taken', 409);
    }
  }

  private assertCanManageRole(actor: AuthUser, targetRole: AuthUser['role']): void {
    if (!canManageUserAccount(actor, targetRole)) {
      throw new AppError('Forbidden: cannot manage accounts at or above your role', 403);
    }
  }

  private handleDuplicateUsername(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('Username is already taken', 409);
    }
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') {
      throw new AppError('Invalid user id', 400);
    }
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid user id', 400);
    }
    return parsed;
  }
}
