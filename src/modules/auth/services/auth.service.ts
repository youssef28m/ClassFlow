import { Prisma, Role, type User } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { AuthUser, LoginResponse } from '../types/auth.types.js';
import type { LoginInput, SignupInput } from '../validation/auth.validation.js';
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './jwt.service.js';
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

    return this.issueTokenPair(user);
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

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.repository.findRefreshTokenByHash(tokenHash);
    if (!stored || stored.revokedAt) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    if (stored.expiresAt <= new Date()) {
      await this.repository.revokeRefreshToken(tokenHash);
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await this.repository.findById(stored.userId);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Rotate: revoke the used token before issuing a new pair, so a stolen
    // refresh token is only usable once.
    await this.repository.revokeRefreshToken(tokenHash, stored.userId);

    return this.issueTokenPair(user);
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      throw new AppError('Missing refresh token', 400);
    }
    await this.repository.revokeRefreshToken(hashRefreshToken(refreshToken), userId);
  }

  async logoutAll(userId: number): Promise<void> {
    await this.repository.revokeAllRefreshTokens(userId);
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

  private async issueTokenPair(user: User): Promise<LoginResponse> {
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(authUser);
    const { token: refreshToken, expiresAt } = signRefreshToken(authUser);

    await this.repository.createRefreshToken({
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: authUser,
    };
  }
}
