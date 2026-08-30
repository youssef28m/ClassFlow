import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  usersApi,
  userKeys,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/features/users/api";
import type { UserFilters } from "@/features/users/types";

export function useUsersQuery(filters: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => usersApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ centerId, payload }: { centerId: number; payload: CreateUserPayload }) =>
      usersApi.create(centerId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      centerId,
      payload,
    }: {
      id: number;
      centerId: number;
      payload: UpdateUserPayload;
    }) => usersApi.update(id, centerId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, centerId }: { id: number; centerId: number }) =>
      usersApi.delete(id, centerId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}