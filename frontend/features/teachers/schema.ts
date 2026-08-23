import { z } from "zod";
import type { Teacher } from "@/features/teachers/types";

export const teacherFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  specialization: z.string().trim().min(1, "Specialization is required").max(100),
  active: z.boolean(),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export interface TeacherPayload {
  fullName: string;
  phone: string;
  specialization: string;
  active: boolean;
}

export function toTeacherPayload(values: TeacherFormValues): TeacherPayload {
  return {
    fullName: values.fullName.trim(),
    phone: values.phone.trim(),
    specialization: values.specialization.trim(),
    active: values.active,
  };
}

export function toTeacherFormValues(teacher: Teacher): TeacherFormValues {
  return {
    fullName: teacher.fullName,
    phone: teacher.phone,
    specialization: teacher.specialization,
    active: teacher.active,
  };
}
