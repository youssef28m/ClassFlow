"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import { useGroupsQuery } from "@/features/groups/hooks";
import { useCreateSchedule, useUpdateSchedule } from "@/features/schedules/hooks";
import { DAYS_OF_WEEK, type Schedule } from "@/features/schedules/types";
import { scheduleFormSchema, toScheduleFormValues, toSchedulePayload, type ScheduleFormValues } from "@/features/schedules/schema";
import { ApiError } from "@/lib/api-client";
import { humanizeEnum } from "@/lib/formatters";

interface ScheduleFormDialogProps { open: boolean; onClose: () => void; schedule?: Schedule | null; }
const SCHEDULE_FORM_FIELDS = new Set<keyof ScheduleFormValues>(["groupId", "dayOfWeek", "startTime", "endTime"]);

function defaultValues(): ScheduleFormValues { return { groupId: "", dayOfWeek: "SATURDAY", startTime: "15:00", endTime: "16:00" }; }

export function ScheduleFormDialog({ open, onClose, schedule }: ScheduleFormDialogProps) {
  const toast = useToast();
  const groups = useGroupsQuery({ pageSize: 100 });
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const [rootError, setRootError] = useState<string | null>(null);
  const initialValues = useMemo(() => schedule ? toScheduleFormValues(schedule) : defaultValues(), [schedule]);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<ScheduleFormValues>({ resolver: zodResolver(scheduleFormSchema), defaultValues: initialValues });
  const isSaving = createSchedule.isPending || updateSchedule.isPending;
  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    const payload = toSchedulePayload(values);
    try {
      if (schedule) {
        await updateSchedule.mutateAsync({
          id: schedule.id,
          payload: {
            dayOfWeek: payload.dayOfWeek,
            startTime: payload.startTime,
            endTime: payload.endTime,
          },
        });
        toast.success("Schedule updated");
      } else {
        await createSchedule.mutateAsync(payload);
        toast.success("Schedule added");
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && SCHEDULE_FORM_FIELDS.has(field as keyof ScheduleFormValues)) { hasFieldErrors = true; setError(field as keyof ScheduleFormValues, { message }); }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else setRootError("Something went wrong. Please try again.");
    }
  });

  return <FormDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} title={schedule ? "Edit schedule" : "Add schedule"} description={schedule ? "Update this group's weekly time slot." : "Set a recurring weekly time slot for a group."}>
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {rootError ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{rootError}</p> : null}
      <Field label="Group" htmlFor="schedule-group" error={errors.groupId?.message}><select id="schedule-group" className={inputClassName} aria-invalid={Boolean(errors.groupId)} disabled={Boolean(schedule)} {...register("groupId")}><option value="">{groups.isLoading ? "Loading groups…" : "Select a group…"}</option>{(groups.data?.items ?? []).map((group) => <option key={group.id} value={group.id}>{group.name} — {group.subject}</option>)}</select></Field>
      <Field label="Day" htmlFor="schedule-day" error={errors.dayOfWeek?.message}><select id="schedule-day" className={inputClassName} {...register("dayOfWeek")}>{DAYS_OF_WEEK.map((day) => <option key={day} value={day}>{humanizeEnum(day)}</option>)}</select></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Start time" htmlFor="schedule-start" error={errors.startTime?.message}><input id="schedule-start" type="time" className={inputClassName} {...register("startTime")} /></Field><Field label="End time" htmlFor="schedule-end" error={errors.endTime?.message}><input id="schedule-end" type="time" className={inputClassName} {...register("endTime")} /></Field></div>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={isSaving} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-60">Cancel</button><button type="submit" disabled={isSaving || groups.isLoading} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">{isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}{schedule ? "Save changes" : "Add schedule"}</button></div>
    </form>
  </FormDialog>;
}
