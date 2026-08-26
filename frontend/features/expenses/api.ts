import { apiClient, type QueryParams } from "@/lib/api-client";
import type {
  ExpenseFilters,
  ExpenseListResponse,
  ExpensePayload,
} from "@/features/expenses/types";

export const expensesApi = {
  list(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    return apiClient.request<ExpenseListResponse>("/expenses", {
      params: filters as QueryParams,
    });
  },
  create(payload: ExpensePayload): Promise<unknown> {
    return apiClient.request<unknown>("/expenses", {
      method: "POST",
      body: payload,
    });
  },
  update(id: number, payload: Partial<ExpensePayload>): Promise<unknown> {
    return apiClient.request<unknown>(`/expenses/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/expenses/${id}`, { method: "DELETE" });
  },
};

export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
};
