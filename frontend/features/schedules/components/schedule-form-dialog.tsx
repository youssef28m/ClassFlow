"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { TimeSelect } from "@/components/forms/time-select";
import { useToast } from "@/components/feedback/toast";
import { useGroupsQuery } from "@/features/groups/hooks";
import { useCreateSchedule, useUpdateSchedule } from "@/features/schedules/hooks";
import { DAYS_OF_WEEK, type Schedule } from "@/features/schedules/types";
import { scheduleFormSchema, toScheduleFormValues, toSchedulePayload, type ScheduleFormValues } from "@/features/schedules/schema";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface ScheduleFormDialogProps { open: boolean; onClose: () => void; schedule?: Schedule | null; }
const SCHEDULE_FORM_FIELDS = new Set<keyof ScheduleFormValues>(["groupId", "dayOfWeek", "startTime", "endTime"]);

function defaultValues(): ScheduleFormValues { return { groupId: "", dayOfWeek: "SATURDAY", startTime: "15:00", endTime: "16:00" }; }

export function ScheduleFormDialog({ open, onClose, schedule }: ScheduleFormDialogProps) {
  const toast = useToast();
  const groups = useGroupsQuery({ pageSize: 100 });
  const { t, tEnum } = useI18n();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const [rootError, setRootError] = useState<string | null>(null);
  const initialValues = useMemo(() => schedule ? toScheduleFormValues(schedule) : defaultValues(), [schedule]);
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<ScheduleFormValues>({ resolver: zodResolver(scheduleFormSchema), defaultValues: initialValues });
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
        toast.success(t("schedules.updated"));
      } else {
        await createSchedule.mutateAsync(payload);
        toast.success(t("schedules.added"));
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
      } else setRootError(t("common.somethingWentWrong"));
    }
  });

  return <FormDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} title={schedule ? t("schedules.editTitle") : t("schedules.addTitle")} description={schedule ? t("schedules.editDescription") : t("schedules.addDescription")}>
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {rootError ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{rootError}</p> : null}
      <Field label={t("nav.groups")} htmlFor="schedule-group" error={errors.groupId?.message}><select id="schedule-group" className={inputClassName} aria-invalid={Boolean(errors.groupId)} disabled={Boolean(schedule)} {...register("groupId")}><option value="">{groups.isLoading ? t("common.loading") : t("schedules.selectGroupPlaceholder")}</option>{(groups.data?.items ?? []).map((group) => <option key={group.id} value={group.id}>{group.name} — {group.subject}</option>)}</select></Field>
      <Field label={t("schedules.day")} htmlFor="schedule-day" error={errors.dayOfWeek?.message}><select id="schedule-day" className={inputClassName} {...register("dayOfWeek")}>{DAYS_OF_WEEK.map((day) => <option key={day} value={day}>{tEnum(day)}</option>)}</select></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("time.start")} htmlFor="schedule-start" error={errors.startTime?.message}>
          <Controller control={control} name="startTime" render={({ field }) => <span id="schedule-start"><TimeSelect value={field.value} onChange={field.onChange} /></span>} />
        </Field>
        <Field label={t("time.end")} htmlFor="schedule-end" error={errors.endTime?.message}>
          <Controller control={control} name="endTime" render={({ field }) => <span id="schedule-end"><TimeSelect value={field.value} onChange={field.onChange} /></span>} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={isSaving} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-60">{t("common.cancel")}</button><button type="submit" disabled={isSaving || groups.isLoading} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">{isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}{schedule ? t("common.saveChanges") : t("schedules.add")}</button></div>
    </form>
  </FormDialog>;
}
