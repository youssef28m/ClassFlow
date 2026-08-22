import { z } from "zod";
import type { LoginCredentials } from "@/types/auth";

export const loginFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or fewer"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be 128 characters or fewer"),
  centerId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d+$/.test(value),
      "Center ID must be a positive number",
    )
    .optional(),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export function toLoginCredentials(values: LoginFormValues): LoginCredentials {
  return {
    username: values.username.trim(),
    password: values.password,
    centerId: values.centerId ? Number(values.centerId) : undefined,
  };
}
