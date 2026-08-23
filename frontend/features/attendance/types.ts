import type { PaginationMeta } from "@/features/students/types";

export type AttendanceStatus = "PRESENT" | "ABSENT";

export interface ClassSession {
  id: number;
  groupId: number;
  scheduleId: number;
  sessionDate: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: number;
  enrollmentId: number;
  sessionId: number;
  status: AttendanceStatus;
  notes: string | null;
  student: { id: number; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface SessionListResponse { items: ClassSession[]; meta: PaginationMeta; }
export interface SessionFilters { page?: number; pageSize?: number; groupId?: number; scheduleId?: number; completed?: boolean; from?: string; to?: string; }
export interface AttendanceSummaryEntry {
  enrollmentId: number;
  studentId: number;
  fullName: string;
  present: number;
  absent: number;
}
