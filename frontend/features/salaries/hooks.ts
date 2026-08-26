import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { salaryKeys, salariesApi } from "@/features/salaries/api";
import type {
  PaySalaryPayload,
  SalaryFilters,
} from "@/features/salaries/types";

export function useSalariesQuery(filters: SalaryFilters) {
  return useQuery({
    queryKey: salaryKeys.list(filters),
    queryFn: () => salariesApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCalculateSalary(params: {
  teacherId?: number;
  from: string;
  to: string;
  percentage: number;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["salaries", "calculate", params] as const,
    queryFn: () =>
      salariesApi.calculate({
        teacherId: params.teacherId,
        from: params.from,
        to: params.to,
        percentage: params.percentage,
      }),
    enabled: params.enabled,
  });
}

function invalidateSalaries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
}

export function usePaySalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaySalaryPayload) => salariesApi.pay(payload),
    onSuccess: () => invalidateSalaries(queryClient),
  });
}

export function useUpdateSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<{ isPaid: boolean; notes: string | null }>;
    }) => salariesApi.update(id, payload),
    onSuccess: () => invalidateSalaries(queryClient),
  });
}

export function useDeleteSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => salariesApi.remove(id),
    onSuccess: () => invalidateSalaries(queryClient),
  });
}

export function useSalaryReport(id: number | null) {
  return useQuery({
    queryKey: ["salaries", "report", id] as const,
    queryFn: () => salariesApi.report(id!),
    enabled: id !== null,
  });
}
