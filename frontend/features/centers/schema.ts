import { z } from "zod";
import type { Center } from "@/features/centers/types";

export const centerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or fewer"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(20, "Phone must be 20 characters or fewer"),
});

export type CenterFormValues = z.infer<typeof centerFormSchema>;

export interface CenterPayload {
  name: string;
  address: string;
  phone: string;
  active?: boolean;
}

export function toCenterPayload(values: CenterFormValues): CenterPayload {
  return {
    name: values.name,
    address: values.address,
    phone: values.phone,
  };
}

export function toCenterFormValues(center: Center): CenterFormValues {
  return {
    name: center.name,
    address: center.address,
    phone: center.phone,
  };
}