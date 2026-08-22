import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { teacherKeys, teachersApi } from "@/features/teachers/api";
import type { TeacherPayload } from "@/features/teachers/schema";
import type { TeacherFilters } from "@/features/teachers/types";

export function useTeachersQuery(filters: TeacherFilters) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => teachersApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeacherPayload) => teachersApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.lists() }),
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TeacherPayload> }) =>
      teachersApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.lists() }),
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teachersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teacherKeys.lists() }),
  });
}
