export const USER_ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "MANAGER",
  "ACCOUNTANT",
  "RECEPTIONIST",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  centerId: number | null;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface LoginCredentials {
  username: string;
  password: string;
  centerId?: number;
}
