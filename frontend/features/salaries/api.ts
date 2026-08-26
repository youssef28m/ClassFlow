import { apiClient, type QueryParams } from "@/lib/api-client";
import type {
  PaySalaryPayload,
  SalaryCalculationResult,
  SalaryListResponse,
  SalaryReport,
} from "@/features/salaries/types";

export const salariesApi = {
  list(filters: SalaryFilters = {}): Promise<SalaryListResponse> {
    return apiClient.request<SalaryListResponse>("/teacher-salaries", {
      params: filters as QueryParams,
    });
  },
  calculate(params: {
    teacherId?: number;
    from: string;
    to: string;
    percentage: number;
  }): Promise<SalaryCalculationResult> {
    return apiClient.request<SalaryCalculationResult>("/teacher-salaries/calculate", {
      params: params as QueryParams,
    });
  },
  pay(payload: PaySalaryPayload): Promise<unknown> {
    return apiClient.request<unknown>("/teacher-salaries/pay", {
      method: "POST",
      body: payload,
    });
  },
  update(
    id: number,
    payload: Partial<{ isPaid: boolean; notes: string | null }>,
  ): Promise<unknown> {
    return apiClient.request<unknown>(`/teacher-salaries/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },
  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/teacher-salaries/${id}`, {
      method: "DELETE",
    });
  },
  report(id: number): Promise<SalaryReport> {
    return apiClient.request<SalaryReport>(`/teacher-salaries/${id}/report`);
  },
};

export const salaryKeys = {
  all: ["salaries"] as const,
  lists: () => [...salaryKeys.all, "list"] as const,
  list: (filters: SalaryFilters) => [...salaryKeys.lists(), filters] as const,
};

interface SalaryFilters {
  page?: number;
  pageSize?: number;
  teacherId?: number;
  salaryMonth?: number;
  salaryYear?: number;
  isPaid?: boolean;
}
