import type { PaginationMeta } from "@/features/students/types";

export const PAYMENT_METHODS = ["CASH", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  id: number;
  enrollmentId: number;
  studentName: string;
  groupName: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListResponse {
  items: Payment[];
  meta: PaginationMeta;
}

export interface PaymentFilters {
  page?: number;
  pageSize?: number;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
}

export interface PaymentPayload {
  enrollmentId: number;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}
