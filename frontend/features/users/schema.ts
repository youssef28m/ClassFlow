import { z } from "zod";

/** Roles a superadmin can assign to users created inside a center. */
export const CENTER_USER_ROLES = [
  "ADMIN",
  "MANAGER",
  "ACCOUNTANT",
  "RECEPTIONIST",
] as const;

const usernameField = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username must be 50 characters or fewer");

const createPasswordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer");

const editPasswordField = z
  .string()
  .max(128, "Password must be 128 characters or fewer")
  .refine((value) => value === "" || value.length >= 8, {
    message: "Password must be at least 8 characters",
  });

export const createUserFormSchema = z.object({
  username: usernameField,
  password: createPasswordField,
  role: z.enum(CENTER_USER_ROLES),
  centerId: z.coerce.number().int().min(1, "Select a center"),
});

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export const editUserFormSchema = z.object({
  username: usernameField,
  password: editPasswordField,
  role: z.enum(CENTER_USER_ROLES),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;