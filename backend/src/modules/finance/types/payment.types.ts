import type { Payment, PaymentMethod } from '../../../generated/prisma/client.js';

export interface PaymentDTO {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  groupId: number;
  groupName: string;
  amount: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  targetPeriodStart: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EnrollmentForPayment {
  student: { id: number; fullName: string };
  group: { id: number; name: string };
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

export interface EnrollmentPaymentEntryDTO {
  enrollmentId: number;
  groupId: number;
  groupName: string;
  subject: string;
  fee: string;
  paymentType: string;
  active: boolean;
  enrolledOn: Date;
  totalPaid: string;
  lastPaymentDate: Date | null;
  periodStart: string | null;
  dueDate: string | null;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | null;
  daysOverdue: number | null;
}

export interface StudentPaymentSummaryDTO {
  student: {
    id: number;
    fullName: string;
    grade: string;
    school: string | null;
    phone: string | null;
    parentPhone: string | null;
    joinDate: Date;
    status: string;
  };
  enrollments: EnrollmentPaymentEntryDTO[];
  totals: {
    overdueCount: number;
    pendingCount: number;
    paidCount: number;
    totalPaid: string;
  };
}

export function toPaymentDTO(payment: Payment & { enrollment?: EnrollmentForPayment }): PaymentDTO {
  return {
    id: payment.id,
    enrollmentId: payment.enrollmentId,
    studentId: payment.enrollment?.student.id ?? 0,
    studentName: payment.enrollment?.student.fullName ?? '',
    groupId: payment.enrollment?.group.id ?? 0,
    groupName: payment.enrollment?.group.name ?? '',
    amount: payment.amount.toString(),
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    targetPeriodStart: payment.targetPeriodStart ?? null,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export interface AvailablePeriodDTO {
  periodStart: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'UNPAID';
  totalPaid: number;
}
