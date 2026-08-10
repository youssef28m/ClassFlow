import type { Student, StudentStatus } from '../../../generated/prisma/client.js';

export interface StudentDTO {
  id: number;
  fullName: string;
  phone: string;
  parentPhone: string | null;
  grade: string;
  school: string | null;
  address: string;
  joinDate: Date;
  status: StudentStatus;
  notes: string | null;
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

export function toStudentDTO(student: Student): StudentDTO {
  return {
    id: student.id,
    fullName: student.fullName,
    phone: student.phone,
    parentPhone: student.parentPhone,
    grade: student.grade,
    school: student.school,
    address: student.address,
    joinDate: student.joinDate,
    status: student.status,
    notes: student.notes,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}
