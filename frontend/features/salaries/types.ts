import type { PaginationMeta } from "@/features/students/types";

export interface Salary {
  id: number;
  teacherId: number;
  teacherName?: string;
  salaryMonth: number;
  salaryYear: number;
  amount: string;
  paymentSum: string;
  percentage: string;
  paymentDate: string;
  isPaid: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryListResponse {
  items: Salary[];
  meta: PaginationMeta;
}

export interface SalaryFilters {
  page?: number;
  pageSize?: number;
  teacherId?: number;
  salaryMonth?: number;
  salaryYear?: number;
  isPaid?: boolean;
}

export interface SalaryCalculationEntry {
  teacherId: number;
  teacherName: string;
  totalPayments: string;
  calculatedSalary: string;
}

export interface SalaryCalculationResult {
  percentage: number;
  from: string;
  to: string;
  teachers: SalaryCalculationEntry[];
}

export interface PaySalaryPayload {
  teacherId: number;
  from: string;
  to: string;
  percentage: number;
  paymentDate: string;
  notes?: string | null;
}

export interface SalaryReportPayment {
  id: number;
  amount: string;
  paymentDate: string;
  method: string;
}

export interface SalaryReportStudent {
  studentId: number;
  studentName: string;
  grade: string | null;
  school: string | null;
  payments: SalaryReportPayment[];
  totalPaid: string;
}

export interface SalaryReportGroup {
  groupId: number;
  groupName: string;
  subject: string;
  fee: string;
  studentCount: number;
  students: SalaryReportStudent[];
  groupTotal: string;
}

export interface SalaryReport {
  salaryId: number;
  teacherName: string;
  salaryMonth: number;
  salaryYear: number;
  amount: string;
  paymentSum: string;
  percentage: string;
  paymentDate: string;
  isPaid: boolean;
  groups: SalaryReportGroup[];
  totalStudents: number;
  totalPayments: string;
}
