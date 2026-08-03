import { Prisma, Role, type User } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { AuthUser, LoginResponse } from '../types/auth.types.js';
import type { LoginInput, SignupInput } from '../validation/auth.validation.js';
import { signAccessToken } from './jwt.service.js';
import { hashPassword, verifyPassword } from './password.service.js';

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    const user = await this.repository.findByUsername(input.username);
    if (!user) {
      throw new AppError('Invalid username or password', 401);
    }

    const passwordMatches = await verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('Invalid username or password', 401);
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      token: signAccessToken(authUser),
      user: authUser,
    };
  }

  async signup(input: SignupInput): Promise<LoginResponse> {
    const existing = await this.repository.findByUsername(input.username);
    if (existing) {
      throw new AppError('Username is already taken', 409);
    }

    const passwordHash = await hashPassword(input.password);

    let user: User;
    try {
      user = await this.repository.create({
        username: input.username,
        passwordHash,
        role: Role.RECEPTIONIST,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Username is already taken', 409);
      }
      throw error;
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      token: signAccessToken(authUser),
      user: authUser,
    };
  }

  async getCurrentUser(id: number): Promise<AuthUser> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
