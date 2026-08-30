import type { UserRole } from "@/types/auth";

export interface AdminUser {
  id: number;
  username: string;
  role: UserRole;
  centerId: number | null;
  centerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsersPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  items: AdminUser[];
  meta: UsersPaginationMeta;
}

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  centerId?: number;
}