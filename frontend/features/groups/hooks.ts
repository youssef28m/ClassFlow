import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { groupKeys, groupsApi } from "@/features/groups/api";
import type { GroupPayload } from "@/features/groups/schema";
import type {
  GroupFilters,
  GroupPaymentReportFilters,
} from "@/features/groups/types";

export function useGroupsQuery(filters: GroupFilters) {
  return useQuery({
    queryKey: groupKeys.list(filters),
    queryFn: () => groupsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useGroupQuery(id: number | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(id ?? 0),
    queryFn: () => groupsApi.get(id as number),
    enabled: id !== undefined,
  });
}

export function useGroupPaymentReportQuery(
  id: number | undefined,
  filters: GroupPaymentReportFilters,
) {
  return useQuery({
    queryKey: groupKeys.report(id ?? 0, filters),
    queryFn: () => groupsApi.paymentReport(id as number, filters),
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.lists() }),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<GroupPayload> }) =>
      groupsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.lists() }),
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => groupsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.lists() }),
  });
}
