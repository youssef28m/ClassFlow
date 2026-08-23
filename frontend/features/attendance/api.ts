import { apiClient, type QueryParams } from "@/lib/api-client";
import type { AttendanceRecord, AttendanceStatus, AttendanceSummaryEntry, ClassSession, SessionFilters, SessionListResponse } from "@/features/attendance/types";

export const attendanceApi = {
  listSessions(filters: SessionFilters): Promise<SessionListResponse> { return apiClient.request<SessionListResponse>("/sessions", { params: filters as QueryParams }); },
  getSession(id: number): Promise<ClassSession> { return apiClient.request<ClassSession>(`/sessions/${id}`); },
  createSession(payload: { groupId: number; scheduleId: number; sessionDate: string }): Promise<ClassSession> { return apiClient.request<ClassSession>("/sessions", { method: "POST", body: payload }); },
  completeSession(id: number): Promise<ClassSession> { return apiClient.request<ClassSession>(`/sessions/${id}/complete`, { method: "PATCH" }); },
  deleteSession(id: number): Promise<void> { return apiClient.request<void>(`/sessions/${id}`, { method: "DELETE" }); },
  listRecords(sessionId: number): Promise<AttendanceRecord[]> { return apiClient.request<AttendanceRecord[]>(`/sessions/${sessionId}/attendance`); },
  saveRecords(sessionId: number, records: Array<{ enrollmentId: number; status: AttendanceStatus }>): Promise<AttendanceRecord[]> { return apiClient.request<AttendanceRecord[]>(`/sessions/${sessionId}/attendance`, { method: "PUT", body: { records } }); },
  summary(groupId: number): Promise<AttendanceSummaryEntry[]> { return apiClient.request<AttendanceSummaryEntry[]>("/sessions/attendance-summary", { params: { groupId } }); },
};

export const attendanceKeys = { all: ["attendance"] as const, sessions: (filters: SessionFilters) => [...attendanceKeys.all, "sessions", filters] as const, session: (id: number) => [...attendanceKeys.all, "session", id] as const, records: (sessionId: number) => [...attendanceKeys.all, "records", sessionId] as const, summary: (groupId: number) => [...attendanceKeys.all, "summary", groupId] as const };
