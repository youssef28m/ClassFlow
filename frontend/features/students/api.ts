import { apiClient } from "@/lib/api-client";
import type {
  Student,
  StudentFilters,
  StudentGradesResponse,
  StudentListResponse,
} from "@/features/students/types";
import type { StudentPayload } from "@/features/students/schema";

export const studentsApi = {
  list(filters: StudentFilters = {}): Promise<StudentListResponse> {
    return apiClient.request<StudentListResponse>("/students", {
      params: filters as Record<string, string | number | undefined>,
    });
  },

  get(id: number): Promise<Student> {
    return apiClient.request<Student>(`/students/${id}`);
  },

  grades(): Promise<StudentGradesResponse> {
    return apiClient.request<StudentGradesResponse>("/students/grades");
  },

  create(payload: StudentPayload): Promise<Student> {
    return apiClient.request<Student>("/students", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: Partial<StudentPayload>): Promise<Student> {
    return apiClient.request<Student>(`/students/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/students/${id}`, { method: "DELETE" });
  },
};

export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: StudentFilters) => [...studentKeys.lists(), filters] as const,
  grades: () => [...studentKeys.all, "grades"] as const,
  detail: (id: number | null) => [...studentKeys.all, "detail", id] as const,
};
