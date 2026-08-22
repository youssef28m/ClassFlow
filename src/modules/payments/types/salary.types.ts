import type { TeacherSalary } from '../../../generated/prisma/client.js';

export interface SalaryDTO {
  id: number;
  teacherId: number;
  salaryMonth: number;
  salaryYear: number;
  amount: string;
  paymentDate: Date;
  isPaid: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SalaryPaginatedResponse {
  items: SalaryDTO[];
  meta: SalaryPaginationMeta;
}

export function toSalaryDTO(salary: TeacherSalary): SalaryDTO {
  return {
    id: salary.id,
    teacherId: salary.teacherId,
    salaryMonth: salary.salaryMonth,
    salaryYear: salary.salaryYear,
    amount: salary.amount.toString(),
    paymentDate: salary.paymentDate,
    isPaid: salary.isPaid,
    notes: salary.notes,
    createdAt: salary.createdAt,
    updatedAt: salary.updatedAt,
  };
}
