"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import { useCreateSession } from "@/features/attendance/hooks";
import type { Schedule } from "@/features/schedules/types";
import { scheduleLabel } from "@/features/schedules/components/schedule-manager";
import { ApiError } from "@/lib/api-client";
import { humanizeEnum } from "@/lib/formatters";

const UTC_DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export function nextOccurrence(dayOfWeek: string, from = new Date()): string {
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const targetIndex = UTC_DAYS.indexOf(dayOfWeek as (typeof UTC_DAYS)[number]);
  while (cursor.getUTCDay() !== targetIndex) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return cursor.toISOString().slice(0, 10);
}

function weekdayOf(dateString: string): string | null {
  const parsed = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return UTC_DAYS[parsed.getUTCDay()] ?? null;
}

interface NewSessionDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: number;
  schedules: Schedule[];
}

export function NewSessionDialog({
  open,
  onClose,
  groupId,
  schedules,
}: NewSessionDialogProps) {
  const toast = useToast();
  const createSession = useCreateSession();
  const [scheduleId, setScheduleId] = useState("");
  const [sessionDate, setSessionDate] = useState(() => nextOccurrence("SUNDAY"));
  const [rootError, setRootError] = useState<string | null>(null);

  const selectedSchedule = schedules.find(
    (schedule) => schedule.id === Number(scheduleId),
  );

  function handleScheduleChange(value: string) {
    setScheduleId(value);
    const selected = schedules.find((schedule) => schedule.id === Number(value));
    if (selected) {
      setSessionDate(nextOccurrence(selected.dayOfWeek));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const selected = schedules.find((schedule) => schedule.id === Number(scheduleId));
    if (!selected) {
      setRootError("Select the weekly slot this session belongs to.");
      return;
    }
    if (weekdayOf(sessionDate) !== selected.dayOfWeek) {
      setRootError(
        `That slot runs on ${humanizeEnum(selected.dayOfWeek)}s — pick a ${humanizeEnum(selected.dayOfWeek).toLowerCase()} date.`,
      );
      return;
    }
    setRootError(null);
    try {
      await createSession.mutateAsync({
        groupId,
        scheduleId: selected.id,
        sessionDate,
      });
      toast.success("Session created");
      setScheduleId("");
      onClose();
    } catch (error) {
      setRootError(
        error instanceof ApiError ? error.message : "Failed to create session.",
      );
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Book a session"
      description="Pick a weekly slot and the date it actually takes place. You can then record attendance for it."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {rootError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {rootError}
          </p>
        ) : null}

        <Field label="Weekly slot" htmlFor="session-schedule">
          <select
            id="session-schedule"
            value={scheduleId}
            onChange={(event) => handleScheduleChange(event.target.value)}
            className={inputClassName}
          >
            <option value="">
              {schedules.length === 0
                ? "No slots defined yet"
                : "Select a slot…"}
            </option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {scheduleLabel(schedule)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date" htmlFor="session-date">
          <input
            id="session-date"
            type="date"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            className={inputClassName}
          />
          {selectedSchedule ? (
            <p className="mt-1 text-xs text-muted-foreground">
              This slot runs on {humanizeEnum(selectedSchedule.dayOfWeek)}s — the date must match.
            </p>
          ) : null}
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createSession.isPending}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createSession.isPending || schedules.length === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {createSession.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Create session
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
