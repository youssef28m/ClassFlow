import type { Role } from '../../../generated/prisma/client.js';

export interface AuthUser {
  id: number;
  username: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
