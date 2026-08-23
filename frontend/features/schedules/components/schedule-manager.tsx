"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { TimeSelect } from "@/components/forms/time-select";
import { inputClassName } from "@/components/forms/field";
import { useToast } from "@/components/feedback/toast";
import {
  useCreateSchedule,
  useDeleteSchedule,
  useSchedulesQuery,
} from "@/features/schedules/hooks";
import { DAY_OF_WEEK, type DayOfWeek, type Schedule } from "@/features/schedules/types";
import { ApiError } from "@/lib/api-client";
import { formatSlotTime, humanizeEnum } from "@/lib/formatters";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function scheduleLabel(schedule: Schedule): string {
  return `${humanizeEnum(schedule.dayOfWeek)} ${formatSlotTime(schedule.startTime)}–${formatSlotTime(schedule.endTime)}`;
}

interface ScheduleManagerProps {
  groupId: number;
  canManage: boolean;
}

function sortSchedules(items: Schedule[]): Schedule[] {
  return [...items].sort((a, b) => {
    const dayDiff =
      DAY_OF_WEEK.indexOf(a.dayOfWeek) - DAY_OF_WEEK.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function ScheduleManager({ groupId, canManage }: ScheduleManagerProps) {
  const toast = useToast();
  const schedules = useSchedulesQuery({ groupId, pageSize: 100 });
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [day, setDay] = useState<DayOfWeek>("SATURDAY");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setFormError("Choose both a start and an end time.");
      return;
    }
    setFormError(null);
    try {
      await createSchedule.mutateAsync({
        groupId,
        dayOfWeek: day,
        startTime,
        endTime,
      });
      toast.success("Slot added to weekly schedule");
      setStartTime("");
      setEndTime("");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to add slot.",
      );
    }
  }

  async function handleDelete(schedule: Schedule) {
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast.success("Slot removed");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Failed to remove slot.",
      );
    }
  }

  const items = sortSchedules(schedules.data?.items ?? []);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">Weekly schedule</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Recurring time slots for this group. Sessions are booked against these slots.
      </p>

      {schedules.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No slots yet. Add at least one slot to book sessions.
        </p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((schedule) => (
            <li
              key={schedule.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm"
            >
              <span className="text-card-foreground">{scheduleLabel(schedule)}</span>
              {canManage ? (
                <button
                  type="button"
                  aria-label={`Remove ${scheduleLabel(schedule)}`}
                  onClick={() => void handleDelete(schedule)}
                  disabled={deleteSchedule.isPending}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-2">
          <label className="sr-only" htmlFor="schedule-day">
            Day of week
          </label>
          <select
            id="schedule-day"
            value={day}
            onChange={(event) => setDay(event.target.value as DayOfWeek)}
            className={`${inputClassName} w-auto`}
          >
            {DAY_OF_WEEK.map((dayOption) => (
              <option key={dayOption} value={dayOption}>
                {humanizeEnum(dayOption)}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="schedule-start">
            Start time
          </label>
          <TimeSelect
            id="schedule-start"
            value={startTime}
            onChange={setStartTime}
          />
          <label className="sr-only" htmlFor="schedule-end">
            End time
          </label>
          <TimeSelect
            id="schedule-end"
            value={endTime}
            onChange={setEndTime}
          />
          <button
            type="submit"
            disabled={createSchedule.isPending}
            className="flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            {createSchedule.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            Add slot
          </button>
          {formError ? (
            <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          ) : null}
        </form>
      ) : null}

      {schedules.error ? (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Could not load the weekly schedule
          {schedules.error instanceof ApiError ? `: ${schedules.error.message}` : "."}
        </p>
      ) : null}
    </section>
  );
}
