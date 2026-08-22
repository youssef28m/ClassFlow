import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { studentKeys, studentsApi } from "@/features/students/api";
import type { StudentPayload } from "@/features/students/schema";
import type { StudentFilters } from "@/features/students/types";

export function useStudentsQuery(filters: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => studentsApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentPayload) => studentsApi.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<StudentPayload>;
    }) => studentsApi.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() }),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => studentsApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() }),
  });
}
