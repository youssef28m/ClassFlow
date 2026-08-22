import type { PaymentType, Prisma, StudentStatus } from '../../../generated/prisma/client.js';

export const enrollmentInclude = {
  student: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      grade: true,
      status: true,
    },
  },
  group: {
    select: {
      id: true,
      name: true,
      subject: true,
      room: true,
      fee: true,
      paymentType: true,
      maxStudents: true,
    },
  },
} satisfies Prisma.EnrollmentInclude;

export type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

/**
 * Same shape as `enrollmentInclude` plus each parent's `centerId`, so services
 * can enforce tenancy on this parent-less resource via `assertCenterScope`.
 */
export const enrollmentDetailInclude = {
  student: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      grade: true,
      status: true,
      centerId: true,
    },
  },
  group: {
    select: {
      id: true,
      name: true,
      subject: true,
      room: true,
      fee: true,
      paymentType: true,
      maxStudents: true,
      centerId: true,
    },
  },
} satisfies Prisma.EnrollmentInclude;

export type EnrollmentDetail = Prisma.EnrollmentGetPayload<{
  include: typeof enrollmentDetailInclude;
}>;

export interface EnrollmentStudentSummary {
  id: number;
  fullName: string;
  phone: string | null;
  grade: string;
  status: StudentStatus;
}

export interface EnrollmentGroupSummary {
  id: number;
  name: string;
  subject: string;
  room: string;
  fee: string;
  paymentType: PaymentType;
  maxStudents: number;
}

export interface EnrollmentDTO {
  id: number;
  studentId: number;
  groupId: number;
  enrollmentDate: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  student: EnrollmentStudentSummary;
  group: EnrollmentGroupSummary;
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

export function toEnrollmentDTO(enrollment: EnrollmentWithRelations): EnrollmentDTO {
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    groupId: enrollment.groupId,
    enrollmentDate: enrollment.enrollmentDate,
    active: enrollment.active,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    student: {
      id: enrollment.student.id,
      fullName: enrollment.student.fullName,
      phone: enrollment.student.phone,
      grade: enrollment.student.grade,
      status: enrollment.student.status,
    },
    group: {
      id: enrollment.group.id,
      name: enrollment.group.name,
      subject: enrollment.group.subject,
      room: enrollment.group.room,
      fee: enrollment.group.fee.toString(),
      paymentType: enrollment.group.paymentType,
      maxStudents: enrollment.group.maxStudents,
    },
  };
}
