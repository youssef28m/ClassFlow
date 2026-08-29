import { apiClient, type QueryParams } from "@/lib/api-client";
import type { EnrollmentFilters, EnrollmentListResponse, Enrollment } from "@/features/enrollments/types";
import type { EnrollmentPayload } from "@/features/enrollments/schema";

export const enrollmentsApi = {
  list(filters: EnrollmentFilters = {}): Promise<EnrollmentListResponse> { return apiClient.request<EnrollmentListResponse>("/enrollments", { params: filters as QueryParams }); },
  create(payload: EnrollmentPayload): Promise<Enrollment> { return apiClient.request<Enrollment>("/enrollments", { method: "POST", body: payload }); },
  setStatus(id: number, active: boolean): Promise<Enrollment> { return apiClient.request<Enrollment>(`/enrollments/${id}/status`, { method: "PATCH", body: { active } }); },
  updateDate(id: number, enrollmentDate: string): Promise<Enrollment> { return apiClient.request<Enrollment>(`/enrollments/${id}/date`, { method: "PATCH", body: { enrollmentDate } }); },
  remove(id: number): Promise<void> { return apiClient.request<void>(`/enrollments/${id}`, { method: "DELETE" }); },
};

export const enrollmentKeys = { all: ["enrollments"] as const, lists: () => [...enrollmentKeys.all, "list"] as const, list: (filters: EnrollmentFilters) => [...enrollmentKeys.lists(), filters] as const };
