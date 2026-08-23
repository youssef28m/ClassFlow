"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import {
  groupFormSchema,
  toGroupFormValues,
  toGroupPayload,
  type GroupFormValues,
} from "@/features/groups/schema";
import type { Group } from "@/features/groups/types";
import { PAYMENT_TYPES } from "@/features/groups/types";
import { useCreateGroup, useUpdateGroup } from "@/features/groups/hooks";
import { useTeachersQuery } from "@/features/teachers/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface GroupFormDialogProps {
  open: boolean;
  onClose: () => void;
  group?: Group | null;
}

function defaultValues(): GroupFormValues {
  return {
    teacherId: "",
    name: "",
    subject: "",
    room: "",
    fee: "",
    paymentType: "MONTHLY",
    maxStudents: "",
  };
}

export function GroupFormDialog({ open, onClose, group }: GroupFormDialogProps) {
  const isEdit = Boolean(group);
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const [rootError, setRootError] = useState<string | null>(null);
  const teachers = useTeachersQuery({ pageSize: 100 });

  const initialValues = useMemo(
    () => (group ? toGroupFormValues(group) : defaultValues()),
    [group],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    const payload = toGroupPayload(values);
    try {
      if (group) {
        await updateGroup.mutateAsync({ id: group.id, payload });
        toast.success(t("groups.updated"));
      } else {
        await createGroup.mutateAsync(payload);
        toast.success(t("groups.created"));
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in groupFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof GroupFormValues, { message });
          }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else {
        setRootError(t("common.somethingWentWrong"));
      }
    }
  });

  const isSaving = createGroup.isPending || updateGroup.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isEdit ? t("groups.editTitle", { name: group?.name ?? "" }) : t("groups.addTitle")}
      description={
        isEdit
          ? t("groups.formEditDescription")
          : t("groups.formAddDescription")
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {rootError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {rootError}
          </p>
        ) : null}

        <Field label={t("common.teacher")} htmlFor="teacherId" error={errors.teacherId?.message}>
          <select
            id="teacherId"
            aria-invalid={Boolean(errors.teacherId)}
            className={inputClassName}
            {...register("teacherId")}
          >
            <option value="">
              {teachers.isLoading ? t("common.loading") : t("groups.selectTeacherPlaceholder")}
            </option>
            {(teachers.data?.items ?? []).map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
                {teacher.active ? "" : ` (${t("enum.INACTIVE").toLowerCase()})`}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("students.columnName")} htmlFor="name" error={errors.name?.message}>
            <input
              id="name"
              type="text"
              autoComplete="off"
              placeholder={t("groups.namePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              className={inputClassName}
              {...register("name")}
            />
          </Field>
          <Field label={t("groups.columnSubject")} htmlFor="subject" error={errors.subject?.message}>
            <input
              id="subject"
              type="text"
              autoComplete="off"
              placeholder={t("groups.subjectPlaceholder")}
              aria-invalid={Boolean(errors.subject)}
              className={inputClassName}
              {...register("subject")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("groups.columnRoom")} htmlFor="room" error={errors.room?.message}>
            <input
              id="room"
              type="text"
              autoComplete="off"
              placeholder={t("groups.roomPlaceholder")}
              aria-invalid={Boolean(errors.room)}
              className={inputClassName}
              {...register("room")}
            />
          </Field>
          <Field
            label={t("groups.fieldMaxStudents")}
            htmlFor="maxStudents"
            error={errors.maxStudents?.message}
          >
            <input
              id="maxStudents"
              type="number"
              min={1}
              max={500}
              aria-invalid={Boolean(errors.maxStudents)}
              className={inputClassName}
              {...register("maxStudents")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("groups.columnFee")} htmlFor="fee" error={errors.fee?.message}>
            <input
              id="fee"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={t("groups.feePlaceholder")}
              aria-invalid={Boolean(errors.fee)}
              className={inputClassName}
              {...register("fee")}
            />
          </Field>
          <Field
            label={t("groups.columnPaymentType")}
            htmlFor="paymentType"
            error={errors.paymentType?.message}
          >
            <select
              id="paymentType"
              aria-invalid={Boolean(errors.paymentType)}
              className={inputClassName}
              {...register("paymentType")}
            >
              {PAYMENT_TYPES.map((paymentType) => (
                <option key={paymentType} value={paymentType}>
                  {tEnum(paymentType)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {isEdit ? t("common.saveChanges") : t("groups.add")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
