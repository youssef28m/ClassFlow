"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
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
import { useGroupsQuery } from "@/features/groups/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  defaultStudentId?: number | null;
  defaultStudentName?: string | null;
}

export function RecordPaymentDialog({
  open,
  onClose,
  defaultStudentId = null,
  defaultStudentName = null,
}: RecordPaymentDialogProps) {
  const toast = useToast();
  const createPayment = useCreatePayment();
  const { t, tEnum } = useI18n();
  const [groupId, setGroupId] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const groups = useGroupsQuery({
    pageSize: 100,
    ...(groupSearch ? { search: groupSearch } : {}),
  });
  const enrollments = useEnrollmentsQuery(
    defaultStudentId
      ? { studentId: defaultStudentId, active: true, pageSize: 100, ...(enrollmentSearch ? { search: enrollmentSearch } : {}) }
      : { groupId: groupId ? Number(groupId) : -1, active: true, pageSize: 100, ...(enrollmentSearch ? { search: enrollmentSearch } : {}) },
  );
  const [rootError, setRootError] = useState<string | null>(null);
  const groupSelectingRef = useRef(false);
  const enrollmentSelectingRef = useRef(false);
  const { register, handleSubmit, setError, setValue, watch, reset, formState: { errors } } =
    useForm<PaymentFormValues>({
      resolver: zodResolver(paymentFormSchema),
      defaultValues: {
        enrollmentId: "",
        amount: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "CASH",
        notes: "",
      },
    });
  const handleGroupSearch = useCallback((q: string) => {
    if (!groupSelectingRef.current) setGroupSearch(q);
  }, []);
  const handleEnrollmentSearch = useCallback((q: string) => {
    if (!enrollmentSelectingRef.current) setEnrollmentSearch(q);
  }, []);
  const handleGroupChange = useCallback((val: string) => {
    groupSelectingRef.current = true;
    setGroupId(val);
    setValue("enrollmentId", "", { shouldValidate: false });
    setValue("amount", "");
    requestAnimationFrame(() => { groupSelectingRef.current = false; });
  }, [setValue]);
  const enrollmentIdValue = watch("enrollmentId");

  const handleEnrollmentChange = useCallback((val: string) => {
    enrollmentSelectingRef.current = true;
    setValue("enrollmentId", val, { shouldValidate: true });
    const enrollment = (enrollments.data?.items ?? []).find(
      (item) => item.id === Number(val),
    );
    if (enrollment) {
      setValue("amount", String(Number(enrollment.group.fee)), { shouldValidate: false });
    }
    requestAnimationFrame(() => { enrollmentSelectingRef.current = false; });
  }, [enrollments.data, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      await createPayment.mutateAsync(toPaymentPayload(values));
      toast.success(t("payments.created"));
      reset();
      setGroupId("");
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

  const groupOptions =
    defaultStudentId
      ? (enrollments.data?.items ?? []).map((e) => ({
          value: e.id,
          label: e.group.name,
          hint: e.group.subject,
        }))
      : (groups.data?.items ?? []).map((g) => ({
          value: g.id,
          label: g.name,
          hint: g.subject,
        }));

  const studentOptions = (enrollments.data?.items ?? []).map((e) => ({
    value: e.id,
    label: e.student.fullName,
    hint: [e.student.grade, e.student.phone].filter(Boolean).join(" · "),
  }));

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
        {defaultStudentId ? (
          <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-card-foreground">
            {t("payments.pickingStudent")}:{" "}
            <span className="font-medium">{defaultStudentName ?? t("common.loading")}</span>
          </p>
        ) : null}
        {!defaultStudentId ? (
          <Field label={t("payments.groupLabel")} htmlFor="payment-group" error={errors.enrollmentId?.message}>
            <SearchableSelect
              value={groupId}
              onChange={handleGroupChange}
              placeholder={t("groups.allGroups")}
              searchPlaceholder={t("groups.searchPlaceholder")}
              emptyText={t("groups.emptyFiltered")}
              loading={groups.isLoading}
              className="min-w-65"
              options={groupOptions}
              onSearch={handleGroupSearch}
            />
          </Field>
        ) : null}
        <Field
          label={defaultStudentId ? t("payments.groupLabel") : t("students.columnName")}
          htmlFor="payment-enrollment"
          error={errors.enrollmentId?.message}
          hint={defaultStudentId ? undefined : t("payments.hintPickStudent")}
        >
          <input type="hidden" {...register("enrollmentId")} />
          <SearchableSelect
            value={enrollmentIdValue}
            onChange={handleEnrollmentChange}
            placeholder={
              defaultStudentId
                ? enrollments.isLoading
                  ? t("common.loading")
                  : t("payments.selectGroup")
                : !groupId
                  ? t("payments.selectGroupFirst")
                  : enrollments.isLoading
                    ? t("payments.loadingStudents")
                    : t("enrollments.namePlaceholder")
            }
            searchPlaceholder={t("groups.searchPlaceholder")}
            emptyText={t("groups.emptyFiltered")}
            disabled={!defaultStudentId && (!groupId || enrollments.isLoading)}
            loading={enrollments.isLoading}
            className="min-w-65"
            options={defaultStudentId ? groupOptions : studentOptions}
            onSearch={handleEnrollmentSearch}
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
            disabled={createPayment.isPending}
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