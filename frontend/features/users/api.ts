import { apiClient } from "@/lib/api-client";
import type { UserRole } from "@/types/auth";
import type { UserFilters, UserListResponse } from "@/features/users/types";

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: UserRole;
}

export interface CenterUserRef {
  id: number;
  username: string;
  role: UserRole;
  centerId: number | null;
}

export const usersApi = {
  list(filters: UserFilters = {}): Promise<UserListResponse> {
    return apiClient.request<UserListResponse>("/users", {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  },

  create(centerId: number, payload: CreateUserPayload): Promise<CenterUserRef> {
    return apiClient.request<CenterUserRef>(`/centers/${centerId}/users`, {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, centerId: number, payload: UpdateUserPayload): Promise<unknown> {
    return apiClient.request<unknown>(`/users/${id}`, {
      method: "PATCH",
      params: { centerId },
      body: payload,
    });
  },

  delete(id: number, centerId: number): Promise<unknown> {
    return apiClient.request<unknown>(`/users/${id}`, {
      method: "DELETE",
      params: { centerId },
    });
  },
};

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
};