import { apiClient } from "@/lib/api-client";
import type {
  Center,
  CenterFilters,
  CenterListResponse,
} from "@/features/centers/types";
import type { CenterPayload } from "@/features/centers/schema";

export const centersApi = {
  list(filters: CenterFilters = {}): Promise<CenterListResponse> {
    return apiClient.request<CenterListResponse>("/centers", {
      params: filters as Record<string, string | number | boolean | undefined>,
    });
  },

  get(id: number): Promise<Center> {
    return apiClient.request<Center>(`/centers/${id}`);
  },

  create(payload: CenterPayload): Promise<Center> {
    return apiClient.request<Center>("/centers", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: Partial<CenterPayload>): Promise<Center> {
    return apiClient.request<Center>(`/centers/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  deactivate(id: number): Promise<Center> {
    return apiClient.request<Center>(`/centers/${id}/deactivate`, {
      method: "PATCH",
    });
  },
};

export const centerKeys = {
  all: ["centers"] as const,
  lists: () => [...centerKeys.all, "list"] as const,
  list: (filters: CenterFilters) => [...centerKeys.lists(), filters] as const,
  details: () => [...centerKeys.all, "detail"] as const,
  detail: (id: number | null) => [...centerKeys.details(), id] as const,
};