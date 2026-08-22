import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { groupKeys, groupsApi } from "@/features/groups/api";
import type { GroupPayload } from "@/features/groups/schema";
import type { GroupFilters } from "@/features/groups/types";

export function useGroupsQuery(filters: GroupFilters) {
  return useQuery({
    queryKey: groupKeys.list(filters),
    queryFn: () => groupsApi.list(filters),
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
