import type { PaginationMeta } from "@/features/students/types";
import type { PaymentType } from "@/features/groups/types";
import type { StudentStatus } from "@/features/students/types";

export interface Enrollment {
  id: number;
  studentId: number;
  groupId: number;
  enrollmentDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  student: { id: number; fullName: string; phone: string | null; grade: string; status: StudentStatus };
  group: { id: number; name: string; subject: string; room: string; fee: string; paymentType: PaymentType; billingAnchorDay: number; maxStudents: number };
}

export interface EnrollmentListResponse { items: Enrollment[]; meta: PaginationMeta; }
export interface EnrollmentFilters { page?: number; pageSize?: number; studentId?: number; groupId?: number; active?: boolean; }
