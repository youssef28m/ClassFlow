import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { teacherKeys, teachersApi } from "@/features/teachers/api";
import type { TeacherFilters } from "@/features/teachers/types";

export function useTeachersQuery(filters: TeacherFilters) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => teachersApi.list(filters),
    placeholderData: keepPreviousData,
  });
}
