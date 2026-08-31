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

export function useStudentGradesQuery() {
  return useQuery({
    queryKey: studentKeys.grades(),
    queryFn: studentsApi.grades,
    staleTime: 30_000,
  });
}

export function useStudentQuery(id: number | null) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.get(id as number),
    enabled: id !== null,
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
    },
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
