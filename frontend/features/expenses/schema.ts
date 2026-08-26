import { z } from "zod";
import { EXPENSE_CATEGORIES, type ExpensePayload } from "@/features/expenses/types";

export const expenseFormSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, { message: "Enter a valid amount" })
    .refine((value) => Number(value) > 0, {
      message: "Amount must be greater than 0",
    }),
  expenseDate: z.string().min(1),
  description: z.string().trim().max(500).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export function toExpensePayload(values: ExpenseFormValues): ExpensePayload {
  return {
    category: values.category,
    amount: values.amount,
    expenseDate: values.expenseDate,
    description: values.description ? values.description : null,
  };
}

export function toExpenseFormValues(expense: {
  category: string;
  amount: string;
  expenseDate: string;
  description: string | null;
}): ExpenseFormValues {
  return {
    category: expense.category as ExpenseFormValues["category"],
    amount: expense.amount,
    expenseDate: expense.expenseDate.slice(0, 10),
    description: expense.description ?? "",
  };
}
