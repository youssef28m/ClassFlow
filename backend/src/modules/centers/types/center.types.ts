import type { Role } from '../../../generated/prisma/client.js';

export interface CenterDTO {
  id: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CenterUserDTO {
  id: number;
  username: string;
  role: Role;
  centerId: number | null;
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

export function toCenterDTO(center: {
  id: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CenterDTO {
  return {
    id: center.id,
    name: center.name,
    address: center.address,
    phone: center.phone,
    active: center.active,
    createdAt: center.createdAt,
    updatedAt: center.updatedAt,
  };
}

export function toCenterUserDTO(user: {
  id: number;
  username: string;
  role: Role;
  centerId: number | null;
}): CenterUserDTO {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    centerId: user.centerId,
  };
}
