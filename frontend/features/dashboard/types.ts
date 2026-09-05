import type { PaymentMethod } from "@/features/payments/types";

export interface TodaySession {
  id: number;
  groupId: number;
  groupName: string;
  room: string;
  teacherName: string | null;
  startTime: string;
  endTime: string;
  completed: boolean;
  expectedCount: number;
  presentCount: number;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  total: number;
}

export interface MonthCollected {
  total: string;
  payments: string;
  expenses: string;
  count: number;
}

export interface OverdueStudent {
  studentId: number;
  groupId: number;
  studentName: string;
  groupName: string;
  fee: string;
  dueDate: string;
  daysOverdue: number;
}

export interface OverdueStudents {
  items: OverdueStudent[];
  total: number;
  outstandingAmount: string;
}

export interface MonthlyRevenuePoint {
  month: string;
  payments: string;
  expenses: string;
  total: string;
}

export interface RecentPayment {
  id: number;
  studentId: number;
  studentName: string;
  groupName: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
}

export interface DashboardOverview {
  monthlyRevenue: MonthlyRevenuePoint[] | null;
  recentPayments: RecentPayment[];
  todaySessions: TodaySession[];
  attendanceTrend: AttendanceTrendPoint[];
  monthCollected: MonthCollected | null;
  overdueStudents: OverdueStudents | null;
}
