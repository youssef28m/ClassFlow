"use client";

import { CalendarPlus, CheckCheck, ClipboardCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/tables/status-badge";
import { useToast } from "@/components/feedback/toast";
import type { Enrollment } from "@/features/enrollments/types";
import {
  useCompleteSession,
  useSessionsQuery,
} from "@/features/attendance/hooks";
import { AttendanceDialog } from "@/features/attendance/components/attendance-dialog";
import { NewSessionDialog } from "@/features/attendance/components/new-session-dialog";
import type { ClassSession } from "@/features/attendance/types";
import { scheduleLabel } from "@/features/schedules/components/schedule-manager";
import type { Schedule } from "@/features/schedules/types";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/formatters";

interface SessionsPanelProps {
  groupId: number;
  schedules: Schedule[];
  enrollments: Enrollment[];
  canManageSessions: boolean;
  canMarkAttendance: boolean;
}

function sessionLabel(
  session: ClassSession,
  scheduleById: Map<number, string>,
): string {
  return `${formatDate(session.sessionDate)}${
    scheduleById.get(session.scheduleId)
      ? ` · ${scheduleById.get(session.scheduleId)}`
      : ""
  }`;
}

export function SessionsPanel({
  groupId,
  schedules,
  enrollments,
  canManageSessions,
  canMarkAttendance,
}: SessionsPanelProps) {
  const toast = useToast();
  const sessions = useSessionsQuery({ groupId, pageSize: 100 }, true);
  const completeSession = useCompleteSession();

  const [attendanceSession, setAttendanceSession] = useState<ClassSession | null>(null);
  const [newSessionOpen, setNewSessionOpen] = useState(false);

  const scheduleById = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.id, scheduleLabel(schedule)])),
    [schedules],
  );

  const items = useMemo(
    () =>
      [...(sessions.data?.items ?? [])].sort((a, b) =>
        b.sessionDate.localeCompare(a.sessionDate),
      ),
    [sessions.data],
  );

  async function handleComplete(session: ClassSession) {
    try {
      await completeSession.mutateAsync(session.id);
      toast.success("Session marked as completed");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update session.",
      );
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-card-foreground">Sessions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Booked occurrences of the weekly slots. Open a session to record who attended.
          </p>
        </div>
        {canManageSessions ? (
          <button
            type="button"
            onClick={() => setNewSessionOpen(true)}
            disabled={schedules.length === 0}
            title={schedules.length === 0 ? "Add a weekly slot first" : undefined}
            className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            <CalendarPlus className="size-4" aria-hidden />
            Book session
          </button>
        ) : null}
      </div>

      {sessions.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No sessions booked yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {items.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {formatDate(session.sessionDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scheduleById.get(session.scheduleId) ?? `Slot #${session.scheduleId}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge tone={session.completed ? "success" : "warning"}>
                  {session.completed ? "Completed" : "Upcoming"}
                </StatusBadge>
                {canMarkAttendance ? (
                  <button
                    type="button"
                    onClick={() => setAttendanceSession(session)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
                  >
                    <ClipboardCheck className="size-4" aria-hidden />
                    Take attendance
                  </button>
                ) : null}
                {canManageSessions && !session.completed ? (
                  <button
                    type="button"
                    aria-label={`Mark ${formatDate(session.sessionDate)} completed`}
                    onClick={() => void handleComplete(session)}
                    disabled={completeSession.isPending}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400"
                  >
                    <CheckCheck className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewSessionDialog
        key={`${newSessionOpen}`}
        open={newSessionOpen}
        onClose={() => setNewSessionOpen(false)}
        groupId={groupId}
        schedules={schedules}
      />

      <AttendanceDialog
        key={`attendance-${attendanceSession?.id ?? "none"}`}
        open={Boolean(attendanceSession)}
        onClose={() => setAttendanceSession(null)}
        sessionId={attendanceSession?.id ?? 0}
        sessionLabel={
          attendanceSession
            ? sessionLabel(attendanceSession, scheduleById)
            : ""
        }
        enrollments={enrollments}
      />
    </section>
  );
}
