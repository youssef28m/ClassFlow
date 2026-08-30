import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { centerKeys, centersApi } from "@/features/centers/api";
import type { CenterPayload } from "@/features/centers/schema";
import type { CenterFilters } from "@/features/centers/types";

export function useCentersQuery(filters: CenterFilters) {
  return useQuery({
    queryKey: centerKeys.list(filters),
    queryFn: () => centersApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CenterPayload) => centersApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() }),
  });
}

export function useUpdateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CenterPayload>;
    }) => centersApi.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() }),
  });
}

export function useDeactivateCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => centersApi.deactivate(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() }),
  });
}