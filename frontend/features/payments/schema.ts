import { z } from "zod";
import type { PaymentPayload } from "@/features/payments/types";

export const paymentFormSchema = z.object({
  enrollmentId: z
    .string()
    .min(1, "Required")
    .refine((value) => Number(value) > 0, { message: "Required" }),
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, { message: "Enter a valid amount" })
    .refine((value) => Number(value) > 0, { message: "Amount must be greater than 0" }),
  paymentDate: z.string().min(1),
  paymentMethod: z.enum(["CASH", "CARD"]),
  targetPeriodStart: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function toPaymentPayload(values: PaymentFormValues): PaymentPayload {
  return {
    enrollmentId: Number(values.enrollmentId),
    amount: values.amount,
    paymentDate: values.paymentDate,
    paymentMethod: values.paymentMethod,
    targetPeriodStart: values.targetPeriodStart ? values.targetPeriodStart : null,
    notes: values.notes ? values.notes : null,
  };
}
