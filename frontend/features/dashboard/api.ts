import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardOverview, OverdueStudents } from "@/features/dashboard/types";

export const dashboardApi = {
  overview(): Promise<DashboardOverview> {
    return apiClient.request<DashboardOverview>("/dashboard");
  },
  overdue(): Promise<OverdueStudents> {
    return apiClient.request<OverdueStudents>("/dashboard/overdue");
  },
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  overdue: () => [...dashboardKeys.all, "overdue"] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () => dashboardApi.overview(),
  });
}

export function useOverdueQuery() {
  return useQuery({
    queryKey: dashboardKeys.overdue(),
    queryFn: () => dashboardApi.overdue(),
  });
}
