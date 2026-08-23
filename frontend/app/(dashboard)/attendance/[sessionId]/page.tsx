"use client";

import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/tables/status-badge";
import {
  useAttendanceRecordsQuery,
  useSaveAttendance,
  useSessionQuery,
} from "@/features/attendance/hooks";
import type { AttendanceStatus } from "@/features/attendance/types";
import { useEnrollmentsQuery } from "@/features/enrollments/hooks";
import { scheduleLabel } from "@/features/schedules/components/schedule-manager";
import { useSchedulesQuery } from "@/features/schedules/hooks";
import { useGroupsQuery } from "@/features/groups/hooks";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-store";

export default function SessionAttendancePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Number(params?.sessionId);
  const validId = Number.isInteger(sessionId) && sessionId > 0;

  const { user } = useAuth();
  const canMark = can(user, "groupsAndSessions", "markAttendance");

  const sessionQ = useSessionQuery(validId ? sessionId : null);
  const session = sessionQ.data ?? null;
  const groupId = session?.groupId ?? -1;

  const groups = useGroupsQuery({ pageSize: 100 });
  const groupName = useMemo(
    () => (groups.data?.items ?? []).find((group) => group.id === groupId)?.name ?? `Group #${groupId}`,
    [groups.data, groupId],
  );
  const schedules = useSchedulesQuery({ groupId: validId ? groupId : -1, pageSize: 100 });
  const slotLabel = useMemo(() => {
    if (!session) return "";
    const match = (schedules.data?.items ?? []).find(
      (schedule) => schedule.id === session.scheduleId,
    );
    return match ? ` · ${scheduleLabel(match)}` : "";
  }, [schedules.data, session]);

  const rosterQ = useEnrollmentsQuery({ groupId, active: true, pageSize: 100 });
  const roster = rosterQ.data?.items ?? [];
  const recordsQ = useAttendanceRecordsQuery(validId ? sessionId : null);

  const [overrides, setOverrides] = useState<Record<number, AttendanceStatus | null>>({});
  const [rootError, setRootError] = useState<string | null>(null);
  const saveAttendance = useSaveAttendance();

  const savedById = useMemo(() => {
    const map: Record<number, AttendanceStatus> = {};
    for (const record of recordsQ.data ?? []) {
      map[record.enrollmentId] = record.status;
    }
    return map;
  }, [recordsQ.data]);

  function statusOf(enrollmentId: number): AttendanceStatus | null {
    if (enrollmentId in overrides) return overrides[enrollmentId] ?? null;
    return savedById[enrollmentId] ?? null;
  }

  function toggle(enrollmentId: number, status: AttendanceStatus) {
    setOverrides((previous) => ({
      ...previous,
      [enrollmentId]: statusOf(enrollmentId) === status ? null : status,
    }));
  }

  async function handleSave() {
    setRootError(null);
    const records = roster
      .map((enrollment) => ({
        enrollmentId: enrollment.id,
        status: statusOf(enrollment.id),
      }))
      .filter((record): record is { enrollmentId: number; status: AttendanceStatus } =>
        Boolean(record.status),
      );
    try {
      await saveAttendance.mutateAsync({ sessionId, records });
      setOverrides({});
    } catch (error) {
      setRootError(
        error instanceof ApiError ? error.message : "Failed to save attendance.",
      );
    }
  }

  const presentCount = roster.filter((e) => statusOf(e.id) === "PRESENT").length;
  const absentCount = roster.filter((e) => statusOf(e.id) === "ABSENT").length;

  if (!validId) {
    return (
      <>
        <PageHeader title="Attendance" description="Invalid session id." />
        <BackLink href="/attendance" label="All sessions" />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <BackLink href="/groups" label="Groups" />
        <span className="text-muted-foreground">·</span>
        <Link
          href={`/groups/${groupId}`}
          className="text-sm text-muted-foreground transition-colors hover:text-card-foreground"
        >
          {groupName}
        </Link>
      </div>

      <div className="mt-3">
        <PageHeader
          title={session ? formatDate(session.sessionDate) : "Loading…"}
          description={session ? `${groupName}${slotLabel}` : undefined}
          actions={
            session ? (
              <StatusBadge tone={session.completed ? "success" : "warning"}>
                {session.completed ? "Completed" : "Upcoming"}
              </StatusBadge>
            ) : null
          }
        />
      </div>

      {canMark ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Mark each student, then save. Saving replaces all recorded marks for this session.
        </p>
      ) : (
        <p className="mb-4 text-xs text-muted-foreground">
          You have view-only access to attendance.
        </p>
      )}

      {recordsQ.isLoading || sessionQ.isLoading || rosterQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active students in this group.{" "}
          <Link href={`/groups/${groupId}`} className="text-primary hover:underline">
            Enroll students first
          </Link>
          .
        </p>
      ) : (
        <section className="rounded-xl border border-border bg-card">
          {rootError ? (
            <p
              role="alert"
              className="border-b border-border px-5 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {rootError}
            </p>
          ) : null}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">Student</th>
                <th scope="col" className="hidden px-5 py-3 font-medium sm:table-cell">Grade</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.map((enrollment) => {
                const row = statusOf(enrollment.id);
                return (
                  <tr key={enrollment.id}>
                    <td className="px-5 py-3 font-medium text-card-foreground">
                      {enrollment.student.fullName}
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">
                      {enrollment.student.grade}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          disabled={!canMark}
                          aria-pressed={row === "PRESENT"}
                          aria-label={`${enrollment.student.fullName} attended`}
                          onClick={() => toggle(enrollment.id, "PRESENT")}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                            row === "PRESENT"
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-card-foreground"
                          }`}
                        >
                          <CheckCircle2 className="size-4" aria-hidden />
                          Attended
                        </button>
                        <button
                          type="button"
                          disabled={!canMark}
                          aria-pressed={row === "ABSENT"}
                          aria-label={`${enrollment.student.fullName} absent`}
                          onClick={() => toggle(enrollment.id, "ABSENT")}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                            row === "ABSENT"
                              ? "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-card-foreground"
                          }`}
                        >
                          <XCircle className="size-4" aria-hidden />
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {canMark ? (
            <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-4">
              <span className="text-xs text-muted-foreground tabular-nums">
                {presentCount} attended · {absentCount} absent ·{" "}
                {roster.length - presentCount - absentCount} unmarked
              </span>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saveAttendance.isPending}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
              >
                {saveAttendance.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Save attendance
              </button>
            </div>
          ) : null}
        </section>
      )}
    </>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-card-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
