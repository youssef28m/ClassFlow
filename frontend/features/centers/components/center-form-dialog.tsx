"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import {
  centerFormSchema,
  toCenterFormValues,
  toCenterPayload,
  type CenterFormValues,
} from "@/features/centers/schema";
import type { Center } from "@/features/centers/types";
import { useCreateCenter, useUpdateCenter } from "@/features/centers/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface CenterFormDialogProps {
  open: boolean;
  onClose: () => void;
  center?: Center | null;
}

function defaultValues(): CenterFormValues {
  return {
    name: "",
    address: "",
    phone: "",
  };
}

export function CenterFormDialog({
  open,
  onClose,
  center,
}: CenterFormDialogProps) {
  const isEdit = Boolean(center);
  const toast = useToast();
  const { t } = useI18n();
  const createCenter = useCreateCenter();
  const updateCenter = useUpdateCenter();
  const [rootError, setRootError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => (center ? toCenterFormValues(center) : defaultValues()),
    [center],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    const payload = toCenterPayload(values);
    try {
      if (center) {
        await updateCenter.mutateAsync({ id: center.id, payload });
        toast.success(t("centers.updated"));
      } else {
        await createCenter.mutateAsync(payload);
        toast.success(t("centers.created"));
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in centerFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof CenterFormValues, { message });
          }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else {
        setRootError(t("common.somethingWentWrong"));
      }
    }
  });

  const isSaving = createCenter.isPending || updateCenter.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isEdit ? t("centers.formEditTitle", { name: center?.name ?? "" }) : t("centers.formAddTitle")}
      description={
        isEdit
          ? t("centers.formEditDescription")
          : t("centers.formAddDescription")
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

        <Field
          label={t("centers.columnName")}
          htmlFor="name"
          error={errors.name?.message}
        >
          <input
            id="name"
            type="text"
            autoComplete="off"
            placeholder={t("centers.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            className={inputClassName}
            {...register("name")}
          />
        </Field>

        <Field
          label={t("centers.columnPhone")}
          htmlFor="phone"
          error={errors.phone?.message}
        >
          <input
            id="phone"
            type="tel"
            autoComplete="off"
            placeholder={t("centers.phonePlaceholder")}
            aria-invalid={Boolean(errors.phone)}
            className={inputClassName}
            {...register("phone")}
          />
        </Field>

        <Field
          label={t("centers.columnAddress")}
          htmlFor="address"
          error={errors.address?.message}
        >
          <input
            id="address"
            type="text"
            autoComplete="off"
            placeholder={t("centers.addressPlaceholder")}
            aria-invalid={Boolean(errors.address)}
            className={inputClassName}
            {...register("address")}
          />
        </Field>

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
            {isEdit ? t("common.saveChanges") : t("centers.add")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}