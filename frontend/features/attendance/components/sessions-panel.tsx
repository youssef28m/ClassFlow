"use client";

import { CalendarPlus, CheckCheck, ClipboardCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { StatusBadge } from "@/components/tables/status-badge";
import { useToast } from "@/components/feedback/toast";
import {
  useCompleteSession,
  useCreateSession,
  useDeleteSession,
  useSessionsQuery,
} from "@/features/attendance/hooks";
import {
  NewSessionDialog,
  nextOccurrence,
} from "@/features/attendance/components/new-session-dialog";
import type { ClassSession } from "@/features/attendance/types";
import type { Schedule } from "@/features/schedules/types";
import { scheduleLabel } from "@/features/schedules/components/schedule-manager";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/formatters";

interface SessionsPanelProps {
  groupId: number;
  schedules: Schedule[];
  canManageSessions: boolean;
}

export function SessionsPanel({
  groupId,
  schedules,
  canManageSessions,
}: SessionsPanelProps) {
  const toast = useToast();
  const sessions = useSessionsQuery({ groupId, pageSize: 100 }, true);
  const completeSession = useCompleteSession();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<ClassSession | null>(null);

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

  async function handleConfirmDelete() {
    if (!deletingSession) return;
    try {
      await deleteSession.mutateAsync(deletingSession.id);
      toast.success("Session deleted");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to delete session.",
      );
    } finally {
      setDeletingSession(null);
    }
  }

  async function handleQuickBook() {
    const booked = new Set(
      items.map((session) => `${session.scheduleId}:${session.sessionDate.slice(0, 10)}`),
    );
    let best: { schedule: Schedule; date: string } | null = null;
    for (const schedule of schedules) {
      for (let week = 0; week < 8; week += 1) {
        const candidate = new Date(`${nextOccurrence(schedule.dayOfWeek)}T00:00:00Z`);
        candidate.setUTCDate(candidate.getUTCDate() + week * 7);
        const date = candidate.toISOString().slice(0, 10);
        if (!booked.has(`${schedule.id}:${date}`)) {
          if (!best || date < best.date) {
            best = { schedule, date };
          }
          break;
        }
      }
    }
    if (!best) {
      toast.error("Every upcoming slot already has a session booked.");
      return;
    }
    try {
      await createSession.mutateAsync({
        groupId,
        scheduleId: best.schedule.id,
        sessionDate: best.date,
      });
      toast.success(`Session booked for ${formatDate(best.date)}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to book session.",
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
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void handleQuickBook()}
              disabled={schedules.length === 0 || createSession.isPending}
              title={
                schedules.length === 0
                  ? "Add a weekly slot first"
                  : "Books the next free date from your weekly slots"
              }
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
            >
              <CalendarPlus className="size-4" aria-hidden />
              Quick book
            </button>
            <button
              type="button"
              onClick={() => setNewSessionOpen(true)}
              disabled={schedules.length === 0}
              title={schedules.length === 0 ? "Add a weekly slot first" : undefined}
              className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
            >
              Pick date…
            </button>
          </div>
        ) : null}
      </div>

      {sessions.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No sessions booked yet. Use{" "}
          <span className="font-medium text-card-foreground">Quick book</span>{" "}
          to schedule the next date from your weekly slots, then take attendance
          from here or the Attendance page.
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
                <Link
                  href={`/attendance/${session.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
                >
                  <ClipboardCheck className="size-4" aria-hidden />
                  Attendance
                </Link>
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
                {canManageSessions ? (
                  <button
                    type="button"
                    aria-label={`Delete session on ${formatDate(session.sessionDate)}`}
                    onClick={() => setDeletingSession(session)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                  >
                    <Trash2 className="size-4" aria-hidden />
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

      <ConfirmDialog
        open={Boolean(deletingSession)}
        onCancel={() => setDeletingSession(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={`Delete the session on ${deletingSession ? formatDate(deletingSession.sessionDate) : ""}?`}
        message="The session and all attendance recorded for it will be removed. This cannot be undone."
        confirmLabel="Delete session"
        tone="danger"
        isLoading={deleteSession.isPending}
      />
    </section>
  );
}
