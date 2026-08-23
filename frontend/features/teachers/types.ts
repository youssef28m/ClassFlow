export interface Teacher {
  id: number;
  fullName: string;
  phone: string;
  specialization: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TeacherListResponse {
  items: Teacher[];
  meta: PaginationMeta;
}

export interface TeacherFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
}
