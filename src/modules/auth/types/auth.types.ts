import type { Role } from '../../../generated/prisma/client.js';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
  centerId: number | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface TokenPair extends LoginResponse {
  refreshToken: string;
}
