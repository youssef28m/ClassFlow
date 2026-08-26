"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { SearchableSelect } from "@/components/forms/searchable-select";
import {
  paymentFormSchema,
  toPaymentPayload,
  type PaymentFormValues,
} from "@/features/payments/schema";
import { PAYMENT_METHODS } from "@/features/payments/types";
import { useCreatePayment } from "@/features/payments/hooks";
import { useEnrollmentsQuery } from "@/features/enrollments/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RecordPaymentDialog({ open, onClose }: RecordPaymentDialogProps) {
  const toast = useToast();
  const createPayment = useCreatePayment();
  const { t, tEnum } = useI18n();
  const students = useStudentsQuery({
    pageSize: 100,
    status: "ACTIVE",
  });
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const enrollments = useEnrollmentsQuery({
    studentId: selectedStudentId ?? undefined,
    active: true,
    pageSize: 100,
  });
  const [rootError, setRootError] = useState<string | null>(null);
  const { register, handleSubmit, setError, setValue, watch, reset, formState: { errors } } =
    useForm<PaymentFormValues>({
      resolver: zodResolver(paymentFormSchema),
      defaultValues: {
        studentId: "",
        enrollmentId: "",
        amount: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "CASH",
        notes: "",
      },
    });
  const enrollmentIdValue = watch("enrollmentId");
  const studentIdValue = watch("studentId");

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      await createPayment.mutateAsync(toPaymentPayload(values));
      toast.success(t("payments.created"));
      reset();
      setSelectedStudentId(null);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in paymentFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof PaymentFormValues, { message });
          }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else setRootError(t("common.somethingWentWrong"));
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title={t("payments.recordPayment")}
      description={t("payments.formDescription")}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {rootError ? (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {rootError}
          </p>
        ) : null}
        <Field
          label={t("students.columnName")}
          htmlFor="payment-student"
          error={errors.studentId?.message ?? errors.enrollmentId?.message}
          hint={t("payments.hintPickStudent")}
        >
          <input type="hidden" {...register("studentId")} />
          <input type="hidden" {...register("enrollmentId")} />
          <SearchableSelect
            value={studentIdValue}
            onChange={(val) => {
              setSelectedStudentId(val ? Number(val) : null);
              setValue("studentId", val, { shouldValidate: true });
              setValue("enrollmentId", "");
              setValue("amount", "");
            }}
            placeholder={students.isLoading ? t("common.loading") : t("enrollments.namePlaceholder")}
            searchPlaceholder={t("groups.searchPlaceholder")}
            emptyText={t("enrollments.noActiveStudents")}
            loading={students.isLoading}
            className="min-w-65"
            options={(students.data?.items ?? []).map((s) => ({
              value: s.id,
              label: s.fullName,
              hint: [s.grade, s.phone].filter(Boolean).join(" · "),
            }))}
          />
        </Field>
        <Field label={t("payments.groupLabel")} htmlFor="payment-enrollment" error={errors.enrollmentId?.message}>
          <input type="hidden" {...register("enrollmentId")} />
          <SearchableSelect
            value={enrollmentIdValue}
            onChange={(val) => {
              setValue("enrollmentId", val, { shouldValidate: true });
              const enrollment = (enrollments.data?.items ?? []).find(
                (item) => item.id === Number(val),
              );
              if (enrollment) setValue("amount", String(Number(enrollment.group.fee)), { shouldValidate: false });
            }}
            placeholder={
              !selectedStudentId
                ? t("payments.selectStudentFirst")
                : enrollments.isLoading
                  ? t("payments.loadingEnrollments")
                  : t("payments.selectGroup")
            }
            searchPlaceholder={t("groups.searchPlaceholder")}
            emptyText={t("groups.emptyFiltered")}
            disabled={!selectedStudentId || enrollments.isLoading}
            loading={enrollments.isLoading}
            className="min-w-65"
            options={(enrollments.data?.items ?? []).map((e) => ({
              value: e.id,
              label: e.group.name,
              hint: e.group.subject,
            }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("payments.amount")} htmlFor="payment-amount" error={errors.amount?.message}>
            <input id="payment-amount" type="text" inputMode="decimal" autoComplete="off" className={inputClassName} {...register("amount")} />
          </Field>
          <Field label={t("payments.date")} htmlFor="payment-date" error={errors.paymentDate?.message}>
            <input id="payment-date" type="date" className={inputClassName} {...register("paymentDate")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("payments.method")} htmlFor="payment-method">
            <select id="payment-method" className={inputClassName} {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {tEnum(method)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("payments.notes")} htmlFor="payment-notes">
            <input id="payment-notes" type="text" maxLength={500} className={inputClassName} {...register("notes")} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createPayment.isPending}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={createPayment.isPending || enrollments.isLoading}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {createPayment.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {t("payments.submit")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
