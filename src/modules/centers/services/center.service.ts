import { Prisma, Role } from '../../../generated/prisma/client.js';
import { assertCanAccessCenter } from '../../../shared/authz/apply-center-scope.js';
import { canManageUserAccount, resolveScope } from '../../../shared/authz/permissions.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthRepository } from '../../auth/repositories/auth.repository.js';
import { hashPassword } from '../../auth/services/password.service.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import type { CenterRepository } from '../repositories/center.repository.js';
import type { CenterDTO, CenterUserDTO, PaginatedResponse } from '../types/center.types.js';
import { toCenterDTO, toCenterUserDTO } from '../types/center.types.js';
import type {
  CreateCenterInput,
  CreateCenterUserInput,
  ListCentersQuery,
  UpdateCenterInput,
} from '../validation/center.validation.js';

type RouteId = string | string[] | undefined;

export class CenterService {
  constructor(
    private readonly repository: CenterRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async create(input: CreateCenterInput): Promise<CenterDTO> {
    const center = await this.repository.create(input);
    return toCenterDTO(center);
  }

  async getById(id: RouteId, user: AuthUser): Promise<CenterDTO> {
    const center = await this.repository.findById(this.parseId(id));
    if (!center) {
      throw new AppError('Center not found', 404);
    }
    assertOwnCenter(user, center.id);
    return toCenterDTO(center);
  }

  async update(id: RouteId, input: UpdateCenterInput): Promise<CenterDTO> {
    const center = await this.repository.update(this.parseId(id), input);
    if (!center) {
      throw new AppError('Center not found', 404);
    }
    return toCenterDTO(center);
  }

  async deactivate(id: RouteId): Promise<CenterDTO> {
    const center = await this.repository.update(this.parseId(id), { active: false });
    if (!center) {
      throw new AppError('Center not found', 404);
    }
    return toCenterDTO(center);
  }

  async list(query: ListCentersQuery, user: AuthUser): Promise<PaginatedResponse<CenterDTO>> {
    const { page, pageSize, search, active } = query;
    // Center-scope actors (ADMIN/MANAGER) only ever see their own center.
    const { items, total } = await this.repository.findMany({
      search,
      active,
      id: resolveScope(user) === 'center' ? (user.centerId ?? undefined) : undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(toCenterDTO),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async registerUser(
    id: RouteId,
    input: CreateCenterUserInput,
    actor: AuthUser,
  ): Promise<CenterUserDTO> {
    const centerId = this.parseId(id);

    assertOwnCenter(actor, centerId);

    const center = await this.repository.findById(centerId);
    if (!center) {
      throw new AppError('Center not found', 404);
    }
    if (!center.active) {
      throw new AppError('Center is deactivated', 400);
    }

    // ADMINs may only create accounts below their own role; ADMIN/SUPERADMIN
    // accounts require a SUPERADMIN actor.
    const role = input.role ?? Role.ADMIN;
    if (!canManageUserAccount(actor, role)) {
      throw new AppError('Forbidden: cannot manage accounts at or above your role', 403);
    }

    const existing = await this.authRepository.findByUsername(input.username, centerId);
    if (existing) {
      throw new AppError('Username is already taken', 409);
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.authRepository.create({
        username: input.username,
        passwordHash,
        role,
        centerId,
      });
      return toCenterUserDTO(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Username is already taken', 409);
      }
      throw error;
    }
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') {
      throw new AppError('Invalid center id', 400);
    }
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid center id', 400);
    }
    return parsed;
  }
}

/** Center-scope actors may only touch their own center; responds with 404. */
function assertOwnCenter(user: AuthUser, centerId: number): void {
  assertCanAccessCenter(resolveScope(user), user.centerId, centerId);
}
