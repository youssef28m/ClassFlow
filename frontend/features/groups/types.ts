export const PAYMENT_TYPES = ["MONTHLY", "TERMLY", "YEARLY", "PER_SESSION"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export interface Group {
  id: number;
  teacherId: number;
  name: string;
  subject: string;
  room: string;
  fee: string;
  paymentType: PaymentType;
  maxStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GroupListResponse {
  items: Group[];
  meta: PaginationMeta;
}

export interface GroupFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  teacherId?: number;
  paymentType?: PaymentType;
}
