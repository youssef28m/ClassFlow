import type { Group, PaymentType } from '../../../generated/prisma/client.js';

export interface GroupDTO {
  id: number;
  teacherId: number;
  name: string;
  subject: string;
  room: string;
  fee: string;
  paymentType: PaymentType;
  maxStudents: number;
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

export function toGroupDTO(group: Group): GroupDTO {
  return {
    id: group.id,
    teacherId: group.teacherId,
    name: group.name,
    subject: group.subject,
    room: group.room,
    fee: group.fee.toString(),
    paymentType: group.paymentType,
    maxStudents: group.maxStudents,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}
