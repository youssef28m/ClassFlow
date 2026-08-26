import type { TeacherSalary } from '../../../generated/prisma/client.js';

export interface SalaryDTO {
  id: number;
  teacherId: number;
  teacherName?: string;
  salaryMonth: number;
  salaryYear: number;
  amount: string;
  paymentSum: string;
  percentage: string;
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

export interface SalaryCalculationEntryDTO {
  teacherId: number;
  teacherName: string;
  totalPayments: string;
  calculatedSalary: string;
}

export interface SalaryCalculationResultDTO {
  percentage: number;
  from: string;
  to: string;
  teachers: SalaryCalculationEntryDTO[];
}

export function toSalaryDTO(salary: TeacherSalary & { teacher?: { fullName: string } }): SalaryDTO {
  return {
    id: salary.id,
    teacherId: salary.teacherId,
    teacherName: salary.teacher?.fullName,
    salaryMonth: salary.salaryMonth,
    salaryYear: salary.salaryYear,
    amount: salary.amount.toString(),
    paymentSum: salary.paymentSum.toString(),
    percentage: salary.percentage.toString(),
    paymentDate: salary.paymentDate,
    isPaid: salary.isPaid,
    notes: salary.notes,
    createdAt: salary.createdAt,
    updatedAt: salary.updatedAt,
  };
}

export interface SalaryReportStudentDTO {
  studentId: number;
  studentName: string;
  grade: string | null;
  school: string | null;
  payments: SalaryReportPaymentDTO[];
  totalPaid: string;
}

export interface SalaryReportPaymentDTO {
  id: number;
  amount: string;
  paymentDate: string;
  method: string;
}

export interface SalaryReportGroupDTO {
  groupId: number;
  groupName: string;
  subject: string;
  fee: string;
  studentCount: number;
  students: SalaryReportStudentDTO[];
  groupTotal: string;
}

export interface SalaryReportDTO {
  salaryId: number;
  teacherName: string;
  salaryMonth: number;
  salaryYear: number;
  amount: string;
  paymentSum: string;
  percentage: string;
  paymentDate: string;
  isPaid: boolean;
  groups: SalaryReportGroupDTO[];
  totalStudents: number;
  totalPayments: string;
}
