import type { Teacher } from '../../../generated/prisma/client.js';

export interface TeacherDTO {
  id: number;
  fullName: string;
  phone: string;
  specialization: string;
  active: boolean;
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

export function toTeacherDTO(teacher: Teacher): TeacherDTO {
  return {
    id: teacher.id,
    fullName: teacher.fullName,
    phone: teacher.phone,
    specialization: teacher.specialization,
    active: teacher.active,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
}
