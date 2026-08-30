import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentKeys, paymentsApi } from "@/features/payments/api";
import { groupKeys } from "@/features/groups/api";
import type { PaymentFilters, PaymentPayload } from "@/features/payments/types";

export function useStudentPaymentSummary(studentId: number | null) {
  return useQuery({
    queryKey: [...paymentKeys.all, "summary", studentId] as const,
    queryFn: () => paymentsApi.studentSummary(studentId as number),
    enabled: studentId !== null,
  });
}

export function usePaymentsQuery(filters: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentPayload) => paymentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}
