import { apiClient, type QueryParams } from "@/lib/api-client";
import type { StudentPaymentSummary } from "@/features/payments/payment-status";
import type {
  AvailablePeriod,
  PaymentFilters,
  PaymentListResponse,
  PaymentPayload,
} from "@/features/payments/types";

export const paymentsApi = {
  list(filters: PaymentFilters = {}): Promise<PaymentListResponse> {
    return apiClient.request<PaymentListResponse>("/payments", {
      params: filters as QueryParams,
    });
  },
  studentSummary(studentId: number): Promise<StudentPaymentSummary> {
    return apiClient.request<StudentPaymentSummary>(
      `/payments/summary/${studentId}`,
    );
  },
  availablePeriods(enrollmentId: number): Promise<AvailablePeriod[]> {
    return apiClient.request<AvailablePeriod[]>(
      `/payments/available-periods/${enrollmentId}`,
    );
  },
  create(payload: PaymentPayload): Promise<unknown> {
    return apiClient.request<unknown>("/payments", { method: "POST", body: payload });
  },
  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/payments/${id}`, { method: "DELETE" });
  },
};

export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  availablePeriods: (enrollmentId: number) => [...paymentKeys.all, "available-periods", enrollmentId] as const,
};
