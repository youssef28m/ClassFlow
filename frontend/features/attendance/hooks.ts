import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, attendanceKeys } from "@/features/attendance/api";
import type { AttendanceStatus, SessionFilters } from "@/features/attendance/types";

export function useSessionsQuery(filters: SessionFilters, enabled: boolean) { return useQuery({ queryKey: attendanceKeys.sessions(filters), queryFn: () => attendanceApi.listSessions(filters), enabled }); }
export function useSessionQuery(id: number | null) { return useQuery({ queryKey: attendanceKeys.session(id ?? 0), queryFn: () => attendanceApi.getSession(id as number), enabled: id !== null }); }
export function useAttendanceRecordsQuery(sessionId: number | null) { return useQuery({ queryKey: attendanceKeys.records(sessionId ?? 0), queryFn: () => attendanceApi.listRecords(sessionId as number), enabled: sessionId !== null }); }
export function useCreateSession() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (payload: { groupId: number; scheduleId: number; sessionDate: string }) => attendanceApi.createSession(payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "sessions"] }) }); }
export function useCompleteSession() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (id: number) => attendanceApi.completeSession(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "sessions"] }) }); }
export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "sessions"] });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "summary"] });
    },
  });
}
export function useSaveAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, records }: { sessionId: number; records: Array<{ enrollmentId: number; status: AttendanceStatus }> }) =>
      attendanceApi.saveRecords(sessionId, records),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.records(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "records"] });
    },
  });
}
