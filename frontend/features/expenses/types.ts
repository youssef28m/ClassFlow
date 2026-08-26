import type { PaginationMeta } from "@/features/students/types";

export const EXPENSE_CATEGORIES = [
  "RENT",
  "SALARIES",
  "SUPPLIES",
  "MAINTENANCE",
  "UTILITIES",
  "MARKETING",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  description: string | null;
  centerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  meta: PaginationMeta;
}

export interface ExpenseFilters {
  page?: number;
  pageSize?: number;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
}

export interface ExpensePayload {
  category: ExpenseCategory;
  amount: string;
  expenseDate: string;
  description?: string | null;
}
