import type { Role, User } from '../../../generated/prisma/client.js';

export interface UserDTO {
  id: number;
  username: string;
  role: Role;
  centerId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    centerId: user.centerId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
