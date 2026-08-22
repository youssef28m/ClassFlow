import type { Session } from '../../../generated/prisma/client.js';

export interface SessionDTO {
  id: number;
  groupId: number;
  scheduleId: number;
  sessionDate: Date;
  completed: boolean;
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

export interface AttendanceDTO {
  id: number;
  enrollmentId: number;
  sessionId: number;
  status: 'PRESENT' | 'ABSENT';
  notes: string | null;
  student: { id: number; fullName: string };
  createdAt: Date;
  updatedAt: Date;
}

export function toAttendanceDTO(attendance: {
  id: number;
  enrollmentId: number;
  sessionId: number;
  status: 'PRESENT' | 'ABSENT';
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  enrollment: { student: { id: number; fullName: string } };
}): AttendanceDTO {
  return {
    id: attendance.id,
    enrollmentId: attendance.enrollmentId,
    sessionId: attendance.sessionId,
    status: attendance.status,
    notes: attendance.notes,
    student: attendance.enrollment.student,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  };
}

export function toSessionDTO(session: Session): SessionDTO {
  return {
    id: session.id,
    groupId: session.groupId,
    scheduleId: session.scheduleId,
    sessionDate: session.sessionDate,
    completed: session.completed,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}
