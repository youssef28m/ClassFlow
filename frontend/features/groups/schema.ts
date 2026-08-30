import { z } from "zod";
import type { Group } from "@/features/groups/types";
import { PAYMENT_TYPES, type PaymentType } from "@/features/groups/types";

export const groupFormSchema = z.object({
  teacherId: z
    .string()
    .min(1, "Teacher is required")
    .regex(/^\d+$/, "Invalid teacher"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(100, "Subject must be 100 characters or fewer"),
  room: z.string().trim().min(1, "Room is required").max(50, "Room must be 50 characters or fewer"),
  fee: z
    .string()
    .trim()
    .min(1, "Fee is required")
    .regex(/^\d{1,8}(\.\d{1,2})?$/, "Fee must be an amount with up to 2 decimal places")
    .refine((value) => Number(value) > 0, "Fee must be greater than 0"),
  paymentType: z.enum(PAYMENT_TYPES),
  maxStudents: z
    .string()
    .min(1, "Max students is required")
    .regex(/^\d+$/, "Max students must be a whole number")
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 500,
      "Max students must be between 1 and 500",
    ),
  billingAnchorDay: z
    .string()
    .min(1, "Billing anchor day is required")
    .regex(/^\d+$/, "Billing anchor day must be a whole number")
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 28,
      "Billing anchor day must be between 1 and 28",
    ),
});

export type GroupFormValues = {
  teacherId: string;
  name: string;
  subject: string;
  room: string;
  fee: string;
  paymentType: PaymentType;
  maxStudents: string;
  billingAnchorDay: string;
};

export interface GroupPayload {
  teacherId: number;
  name: string;
  subject: string;
  room: string;
  fee: string;
  paymentType: PaymentType;
  maxStudents: number;
  billingAnchorDay: number;
}

export function toGroupPayload(values: GroupFormValues): GroupPayload {
  return {
    teacherId: Number(values.teacherId),
    name: values.name.trim(),
    subject: values.subject.trim(),
    room: values.room.trim(),
    fee: values.fee.trim(),
    paymentType: values.paymentType,
    maxStudents: Number(values.maxStudents),
    billingAnchorDay: Number(values.billingAnchorDay) || 1,
  };
}

export function toGroupFormValues(group: Group): GroupFormValues {
  return {
    teacherId: String(group.teacherId),
    name: group.name,
    subject: group.subject,
    room: group.room,
    fee: group.fee,
    paymentType: group.paymentType,
    maxStudents: String(group.maxStudents),
    billingAnchorDay: String(group.billingAnchorDay ?? 1),
  };
}
