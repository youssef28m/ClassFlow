import type { Role } from '../../../generated/prisma/client.js';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface TokenPair extends LoginResponse {
  refreshToken: string;
}
