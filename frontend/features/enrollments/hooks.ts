import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enrollmentKeys, enrollmentsApi } from "@/features/enrollments/api";
import type { EnrollmentFilters } from "@/features/enrollments/types";
import type { EnrollmentPayload } from "@/features/enrollments/schema";

export function useEnrollmentsQuery(filters: EnrollmentFilters) { return useQuery({ queryKey: enrollmentKeys.list(filters), queryFn: () => enrollmentsApi.list(filters), placeholderData: keepPreviousData }); }
function invalidateEnrollments(queryClient: ReturnType<typeof useQueryClient>) { return queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() }); }
export function useCreateEnrollment() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (payload: EnrollmentPayload) => enrollmentsApi.create(payload), onSuccess: () => invalidateEnrollments(queryClient) }); }
export function useSetEnrollmentStatus() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => enrollmentsApi.setStatus(id, active), onSuccess: () => invalidateEnrollments(queryClient) }); }
export function useUpdateEnrollmentDate() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, enrollmentDate }: { id: number; enrollmentDate: string }) => enrollmentsApi.updateDate(id, enrollmentDate), onSuccess: () => invalidateEnrollments(queryClient) }); }
export function useDeleteEnrollment() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (id: number) => enrollmentsApi.remove(id), onSuccess: () => invalidateEnrollments(queryClient) }); }
