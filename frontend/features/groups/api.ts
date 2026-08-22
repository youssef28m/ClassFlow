import { apiClient } from "@/lib/api-client";
import type { Group, GroupFilters, GroupListResponse } from "@/features/groups/types";
import type { GroupPayload } from "@/features/groups/schema";

export const groupsApi = {
  list(filters: GroupFilters = {}): Promise<GroupListResponse> {
    return apiClient.request<GroupListResponse>("/groups", {
      params: filters as Record<string, string | number | undefined>,
    });
  },

  get(id: number): Promise<Group> {
    return apiClient.request<Group>(`/groups/${id}`);
  },

  create(payload: GroupPayload): Promise<Group> {
    return apiClient.request<Group>("/groups", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: Partial<GroupPayload>): Promise<Group> {
    return apiClient.request<Group>(`/groups/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/groups/${id}`, { method: "DELETE" });
  },
};

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (filters: GroupFilters) => [...groupKeys.lists(), filters] as const,
};
