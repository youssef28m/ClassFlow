import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { scheduleKeys, schedulesApi } from "@/features/schedules/api";
import type {
  CreateSchedulePayload,
  UpdateSchedulePayload,
} from "@/features/schedules/api";
import type { ScheduleFilters } from "@/features/schedules/types";

export function useSchedulesQuery(filters?: ScheduleFilters) {
  return useQuery({
    queryKey: scheduleKeys.list(filters ?? {}),
    queryFn: () => schedulesApi.list(filters),
    placeholderData: keepPreviousData,
    enabled: Boolean(filters?.groupId),
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => schedulesApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSchedulePayload }) =>
      schedulesApi.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => schedulesApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() }),
  });
}
