import { apiClient } from "@/lib/api-client";
import type {
  Teacher,
  TeacherFilters,
  TeacherListResponse,
} from "@/features/teachers/types";

export const teachersApi = {
  list(filters: TeacherFilters = {}): Promise<TeacherListResponse> {
    return apiClient.request<TeacherListResponse>("/teachers", {
      params: filters as Record<string, string | number | undefined>,
    });
  },

  get(id: number): Promise<Teacher> {
    return apiClient.request<Teacher>(`/teachers/${id}`);
  },

  create(payload: {
    fullName: string;
    phone: string;
    specialization: string;
    salary: string;
  }): Promise<Teacher> {
    return apiClient.request<Teacher>("/teachers", {
      method: "POST",
      body: payload,
    });
  },
};

export const teacherKeys = {
  all: ["teachers"] as const,
  lists: () => [...teacherKeys.all, "list"] as const,
  list: (filters: TeacherFilters) => [...teacherKeys.lists(), filters] as const,
};
