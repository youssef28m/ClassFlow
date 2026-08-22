import { z } from "zod";

export const enrollmentFormSchema = z.object({
  studentId: z.string().regex(/^\d+$/, "Student is required"),
  groupId: z.string().regex(/^\d+$/, "Group is required"),
  enrollmentDate: z.string().optional(),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;
export interface EnrollmentPayload { studentId: number; groupId: number; enrollmentDate?: string; }
export function toEnrollmentPayload(values: EnrollmentFormValues): EnrollmentPayload {
  return { studentId: Number(values.studentId), groupId: Number(values.groupId), ...(values.enrollmentDate ? { enrollmentDate: values.enrollmentDate } : {}) };
}
