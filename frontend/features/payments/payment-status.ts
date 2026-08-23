export interface EnrollmentPaymentEntry {
  enrollmentId: number;
  groupId: number;
  groupName: string;
  subject: string;
  fee: string;
  paymentType: string;
  active: boolean;
  enrolledOn: string;
  totalPaid: string;
  lastPaymentDate: string | null;
  periodStart: string | null;
  dueDate: string | null;
  status: "PAID" | "PENDING" | "OVERDUE" | null;
  daysOverdue: number | null;
}

export interface StudentPaymentSummary {
  student: {
    id: number;
    fullName: string;
    grade: string;
    school: string | null;
    phone: string | null;
    parentPhone: string | null;
    joinDate: string;
    status: string;
  };
  enrollments: EnrollmentPaymentEntry[];
  totals: {
    overdueCount: number;
    pendingCount: number;
    paidCount: number;
    totalPaid: string;
  };
}
