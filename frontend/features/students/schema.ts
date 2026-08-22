import { z } from "zod";
import { STUDENT_STATUSES, type Student, type StudentStatus } from "@/features/students/types";

export const studentFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or fewer"),
  phone: z.string().trim().max(20, "Phone must be 20 characters or fewer"),
  parentPhone: z
    .string()
    .trim()
    .max(20, "Parent phone must be 20 characters or fewer"),
  grade: z
    .string()
    .trim()
    .min(1, "Grade is required")
    .max(50, "Grade must be 50 characters or fewer"),
  school: z.string().trim().max(100, "School must be 100 characters or fewer"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or fewer"),
  joinDate: z
    .string()
    .min(1, "Join date is required")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid date",
    }),
  status: z.enum(STUDENT_STATUSES),
  notes: z.string().trim().max(500, "Notes must be 500 characters or fewer"),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export interface StudentPayload {
  fullName: string;
  phone: string | null;
  parentPhone: string | null;
  grade: string;
  school: string | null;
  address: string;
  joinDate: string;
  status: StudentStatus;
  notes: string | null;
}

const emptyToNull = (value: string): string | null => (value ? value : null);

export function toStudentPayload(values: StudentFormValues): StudentPayload {
  return {
    fullName: values.fullName,
    phone: emptyToNull(values.phone),
    parentPhone: emptyToNull(values.parentPhone),
    grade: values.grade,
    school: emptyToNull(values.school),
    address: values.address,
    joinDate: values.joinDate,
    status: values.status,
    notes: emptyToNull(values.notes),
  };
}

export function toStudentFormValues(student: Student): StudentFormValues {
  return {
    fullName: student.fullName,
    phone: student.phone ?? "",
    parentPhone: student.parentPhone ?? "",
    grade: student.grade,
    school: student.school ?? "",
    address: student.address,
    joinDate: student.joinDate.slice(0, 10),
    status: student.status,
    notes: student.notes ?? "",
  };
}
