export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export interface Student {
  id: number;
  fullName: string;
  phone: string | null;
  parentPhone: string | null;
  grade: string;
  school: string | null;
  address: string;
  joinDate: string;
  status: StudentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface StudentListResponse {
  items: Student[];
  meta: PaginationMeta;
}

export interface StudentFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StudentStatus;
}
