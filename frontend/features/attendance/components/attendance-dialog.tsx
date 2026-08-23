"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import type { Enrollment } from "@/features/enrollments/types";
import {
  useAttendanceRecordsQuery,
  useSaveAttendance,
} from "@/features/attendance/hooks";
import type { AttendanceStatus } from "@/features/attendance/types";
import { ApiError } from "@/lib/api-client";
import { humanizeEnum } from "@/lib/formatters";

interface AttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  sessionLabel: string;
  enrollments: Enrollment[];
}

export function AttendanceDialog({
  open,
  onClose,
  sessionId,
  sessionLabel,
  enrollments,
}: AttendanceDialogProps) {
  const toast = useToast();
  const records = useAttendanceRecordsQuery(open ? sessionId : null);
  const saveAttendance = useSaveAttendance();
  const [overrides, setOverrides] = useState<Record<number, AttendanceStatus | null>>({});
  const [rootError, setRootError] = useState<string | null>(null);

  const savedById = useMemo(() => {
    const map: Record<number, AttendanceStatus> = {};
    for (const record of records.data ?? []) {
      map[record.enrollmentId] = record.status;
    }
    return map;
  }, [records.data]);

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
    const saveRecords = enrollments
      .map((enrollment) => ({
        enrollmentId: enrollment.id,
        status: statusOf(enrollment.id),
      }))
      .filter((record): record is { enrollmentId: number; status: AttendanceStatus } =>
        Boolean(record.status),
      );
    try {
      await saveAttendance.mutateAsync({ sessionId, records: saveRecords });
      toast.success("Attendance saved");
      setOverrides({});
      onClose();
    } catch (error) {
      setRootError(
        error instanceof ApiError
          ? error.message
          : "Failed to save attendance.",
      );
    }
  }

  const marked = enrollments.filter((enrollment) => statusOf(enrollment.id) !== null);
  const presentCount = enrollments.filter(
    (enrollment) => statusOf(enrollment.id) === "PRESENT",
  ).length;

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={`Attendance — ${sessionLabel}`}
      description="Mark each student as present or absent, then save. Saving replaces all recorded marks for this session."
    >
      {records.isLoading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Loading attendance…
        </p>
      ) : enrollments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No active students in this group yet.
        </p>
      ) : (
        <div className="space-y-4">
          {rootError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
              {rootError}
            </p>
          ) : null}

          <ul className="divide-y divide-border rounded-xl border border-border">
            {enrollments.map((enrollment) => {
              const row = statusOf(enrollment.id);
              return (
                <li
                  key={enrollment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-card-foreground">
                    {enrollment.student.fullName}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      aria-pressed={row === "PRESENT"}
                      aria-label={`${enrollment.student.fullName} attended`}
                      onClick={() => toggle(enrollment.id, "PRESENT")}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
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
                      aria-pressed={row === "ABSENT"}
                      aria-label={`${enrollment.student.fullName} absent`}
                      onClick={() => toggle(enrollment.id, "ABSENT")}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        row === "ABSENT"
                          ? "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400"
                          : "border-border text-muted-foreground hover:bg-muted hover:text-card-foreground"
                      }`}
                    >
                      <XCircle className="size-4" aria-hidden />
                      Absent
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {marked.length}/{enrollments.length} marked · {presentCount}{" "}
              {humanizeEnum("PRESENT").toLowerCase()}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saveAttendance.isPending}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
              >
                Cancel
              </button>
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
          </div>
        </div>
      )}
    </FormDialog>
  );
}
