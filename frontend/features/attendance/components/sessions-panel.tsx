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
import { useI18n } from "@/lib/i18n/provider";
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
  const { t, tEnum } = useI18n();
  const sessions = useSessionsQuery({ groupId, pageSize: 100 }, true);
  const completeSession = useCompleteSession();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [deletingSession, setDeletingSession] = useState<ClassSession | null>(null);

  const scheduleById = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.id, scheduleLabel(schedule, tEnum)])),
    [schedules, tEnum],
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
      toast.success(t("sessions.markedCompleted"));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
    }
  }

  async function handleConfirmDelete() {
    if (!deletingSession) return;
    try {
      await deleteSession.mutateAsync(deletingSession.id);
      toast.success(t("sessions.deletedToast"));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
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
      toast.error(t("sessions.allBooked"));
      return;
    }
    try {
      await createSession.mutateAsync({
        groupId,
        scheduleId: best.schedule.id,
        sessionDate: best.date,
      });
      toast.success(t("sessions.bookedFor", { date: formatDate(best.date) }));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-card-foreground">{t("attendance.sessionsTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("attendance.sessionsSubtitle")}
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
                  ? t("schedules.addSlotFirst")
                  : t("sessions.quickBookHint")
              }
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
            >
              <CalendarPlus className="size-4" aria-hidden />
              {t("sessions.quickBook")}
            </button>
            <button
              type="button"
              onClick={() => setNewSessionOpen(true)}
              disabled={schedules.length === 0}
              title={schedules.length === 0 ? t("schedules.addSlotFirst") : undefined}
              className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
            >
              {t("sessions.pickDate")}
            </button>
          </div>
        ) : null}
      </div>

      {sessions.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("sessions.emptyPrefix")}{" "}
          <span className="font-medium text-card-foreground">{t("sessions.quickBook")}</span>{" "}
          {t("sessions.emptySuffix")}
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
                  {scheduleById.get(session.scheduleId) ?? t("schedules.slotFallbackId", { id: session.scheduleId })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge tone={session.completed ? "success" : "warning"}>
                  {session.completed ? t("enum.COMPLETED") : t("enum.UPCOMING")}
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
                    aria-label={t("sessions.markCompletedAria", { date: formatDate(session.sessionDate) })}
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
                    aria-label={t("sessions.deleteAria", { date: formatDate(session.sessionDate) })}
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
        title={t("sessions.deleteTitle", {
          date: deletingSession ? formatDate(deletingSession.sessionDate) : "",
        })}
        message={t("sessions.deleteMessage")}
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteSession.isPending}
      />
    </section>
  );
}
