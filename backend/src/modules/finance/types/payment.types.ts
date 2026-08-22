import type { Payment, PaymentMethod } from '../../../generated/prisma/client.js';

export interface PaymentDTO {
  id: number;
  enrollmentId: number;
  amount: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
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

export function toPaymentDTO(payment: Payment): PaymentDTO {
  return {
    id: payment.id,
    enrollmentId: payment.enrollmentId,
    amount: payment.amount.toString(),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
