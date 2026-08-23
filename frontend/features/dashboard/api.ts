import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DashboardOverview } from "@/features/dashboard/types";

export const dashboardApi = {
  overview(): Promise<DashboardOverview> {
    return apiClient.request<DashboardOverview>("/dashboard");
  },
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
};

export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () => dashboardApi.overview(),
  });
}
