import { apiClient } from "@/lib/api-client";
import type {
  Schedule,
  ScheduleFilters,
  ScheduleListResponse,
} from "@/features/schedules/types";

export interface CreateSchedulePayload {
  groupId: number;
  dayOfWeek: Schedule["dayOfWeek"];
  startTime: string;
  endTime: string;
}

export interface UpdateSchedulePayload {
  dayOfWeek?: Schedule["dayOfWeek"];
  startTime?: string;
  endTime?: string;
}

export const schedulesApi = {
  list(filters: ScheduleFilters = {}): Promise<ScheduleListResponse> {
    return apiClient.request<ScheduleListResponse>("/schedules", {
      params: filters as Record<string, string | number | undefined>,
    });
  },

  create(payload: CreateSchedulePayload): Promise<Schedule> {
    return apiClient.request<Schedule>("/schedules", {
      method: "POST",
      body: payload,
    });
  },

  update(id: number, payload: UpdateSchedulePayload): Promise<Schedule> {
    return apiClient.request<Schedule>(`/schedules/${id}`, {
      method: "PATCH",
      body: payload,
    });
  },

  remove(id: number): Promise<void> {
    return apiClient.request<void>(`/schedules/${id}`, { method: "DELETE" });
  },
};

export const scheduleKeys = {
  all: ["schedules"] as const,
  lists: () => [...scheduleKeys.all, "list"] as const,
  list: (filters: ScheduleFilters) => [...scheduleKeys.lists(), filters] as const,
};
