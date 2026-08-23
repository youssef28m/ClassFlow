import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentKeys, paymentsApi } from "@/features/payments/api";
import type { PaymentFilters, PaymentPayload } from "@/features/payments/types";

export function usePaymentsQuery(filters: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

function invalidatePayments(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentPayload) => paymentsApi.create(payload),
    onSuccess: () => invalidatePayments(queryClient),
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.remove(id),
    onSuccess: () => invalidatePayments(queryClient),
  });
}
