import { apiClient } from "@/lib/api-client";
import type {
  Teacher,
  TeacherFilters,
  TeacherListResponse,
} from "@/features/teachers/types";
import type { TeacherPayload } from "@/features/teachers/schema";

export const teachersApi = {
  list(filters: TeacherFilters = {}): Promise<TeacherListResponse> {
    return apiClient.request<TeacherListResponse>("/teachers", {
      params: filters as Record<string, string | number | undefined>,
    });
  },

  get(id: number): Promise<Teacher> {
    return apiClient.request<Teacher>(`/teachers/${id}`);
  },

  create(payload: TeacherPayload): Promise<Teacher> {
    return apiClient.request<Teacher>("/teachers", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: Partial<TeacherPayload>): Promise<Teacher> {
    return apiClient.request<Teacher>(`/teachers/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/teachers/${id}`, { method: "DELETE" });
  },
};

export const teacherKeys = {
  all: ["teachers"] as const,
  lists: () => [...teacherKeys.all, "list"] as const,
  list: (filters: TeacherFilters) => [...teacherKeys.lists(), filters] as const,
};
