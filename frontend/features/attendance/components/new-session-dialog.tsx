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
import { useI18n } from "@/lib/i18n/provider";

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
  const { t, tEnum } = useI18n();
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
      setRootError(t("newSession.selectSlotError"));
      return;
    }
    if (weekdayOf(sessionDate) !== selected.dayOfWeek) {
      setRootError(
        t("newSession.wrongDayError", { day: tEnum(selected.dayOfWeek) }),
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
      toast.success(t("newSession.created"));
      setScheduleId("");
      onClose();
    } catch (error) {
      setRootError(
        error instanceof ApiError ? error.message : t("newSession.failed"),
      );
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={t("newSession.title")}
      description={t("newSession.description")}
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

        <Field label={t("schedules.weeklySlot")} htmlFor="session-schedule">
          <select
            id="session-schedule"
            value={scheduleId}
            onChange={(event) => handleScheduleChange(event.target.value)}
            className={inputClassName}
          >
            <option value="">
              {schedules.length === 0
                ? t("schedules.noSlots")
                : t("schedules.selectSlotPlaceholder")}
            </option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {scheduleLabel(schedule, tEnum)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t("common.date")} htmlFor="session-date">
          <input
            id="session-date"
            type="date"
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            className={inputClassName}
          />
          {selectedSchedule ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("newSession.slotRunsOn", { day: tEnum(selectedSchedule.dayOfWeek) })}
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
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={createSession.isPending || schedules.length === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {createSession.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t("newSession.submit")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
