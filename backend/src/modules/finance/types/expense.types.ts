import type { Expense, ExpenseCategory } from '../../../generated/prisma/client.js';

export interface ExpenseDTO {
  id: number;
  category: ExpenseCategory;
  amount: string;
  expenseDate: Date;
  description: string | null;
  centerId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpensePaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ExpensePaginatedResponse {
  items: ExpenseDTO[];
  meta: ExpensePaginationMeta;
}

export function toExpenseDTO(expense: Expense): ExpenseDTO {
  return {
    id: expense.id,
    category: expense.category,
    amount: expense.amount.toString(),
    expenseDate: expense.expenseDate,
    description: expense.description,
    centerId: expense.centerId,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
