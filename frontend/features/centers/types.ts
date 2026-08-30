export interface Center {
  id: number;
  name: string;
  address: string;
  phone: string;
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

export interface CenterListResponse {
  items: Center[];
  meta: PaginationMeta;
}

export interface CenterFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
}