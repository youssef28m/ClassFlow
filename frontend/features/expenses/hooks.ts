import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { expenseKeys, expensesApi } from "@/features/expenses/api";
import { salaryKeys } from "@/features/salaries/api";
import type { ExpensePayload } from "@/features/expenses/types";
import type { ExpenseFilters } from "@/features/expenses/types";

export function useExpensesQuery(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expensesApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

function invalidateExpenses(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpensePayload) => expensesApi.create(payload),
    onSuccess: () => invalidateExpenses(queryClient),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<ExpensePayload>;
    }) => expensesApi.update(id, payload),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => expensesApi.remove(id),
    onSuccess: () => {
      invalidateExpenses(queryClient);
      queryClient.invalidateQueries({ queryKey: salaryKeys.all });
    },
  });
}
