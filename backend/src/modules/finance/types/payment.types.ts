import type { Payment, PaymentMethod } from '../../../generated/prisma/client.js';

export interface PaymentDTO {
  id: number;
  enrollmentId: number;
  studentName: string;
  groupName: string;
  amount: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EnrollmentForPayment {
  student: { fullName: string };
  group: { name: string };
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

export function toPaymentDTO(payment: Payment & { enrollment?: EnrollmentForPayment }): PaymentDTO {
  return {
    id: payment.id,
    enrollmentId: payment.enrollmentId,
    studentName: payment.enrollment?.student.fullName ?? '',
    groupName: payment.enrollment?.group.name ?? '',
    amount: payment.amount.toString(),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
