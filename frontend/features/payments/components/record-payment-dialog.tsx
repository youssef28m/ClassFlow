"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { useAvailablePeriods, useCreatePayment } from "@/features/payments/hooks";
import { useEnrollmentsQuery } from "@/features/enrollments/hooks";
import { useGroupsQuery } from "@/features/groups/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { PaymentType } from "@/features/groups/types";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  defaultStudentId?: number | null;
  defaultStudentName?: string | null;
}

type PeriodStatus = "PAID" | "PENDING" | "OVERDUE" | "UNPAID";

const FIELD_ERROR_KEYS: Record<string, "payments.error.enrollmentId" | "payments.error.amountPositive" | "payments.error.amountDecimal" | "payments.error.amountLarge" | "payments.error.notesLong"> = {
  "Enrollment id must be a positive integer": "payments.error.enrollmentId",
  "Amount must be greater than 0": "payments.error.amountPositive",
  "Amount must have up to 2 decimal places": "payments.error.amountDecimal",
  "Amount is too large": "payments.error.amountLarge",
  "Notes are too long": "payments.error.notesLong",
};

function translateFieldMessage(message: string, t: (key: TranslationKey) => string): string {
  const key = FIELD_ERROR_KEYS[message];
  return key ? t(key) : message;
}

function periodStatusKey(status: PeriodStatus): "payments.periodStatusPaid" | "payments.periodStatusPending" | "payments.periodStatusOverdue" | "payments.periodStatusUnpaid" {
  switch (status) {
    case "PAID":
      return "payments.periodStatusPaid";
    case "PENDING":
      return "payments.periodStatusPending";
    case "OVERDUE":
      return "payments.periodStatusOverdue";
    case "UNPAID":
      return "payments.periodStatusUnpaid";
  }
}

function periodLabel(
  periodStart: string,
  dueDate: string,
  paymentType: PaymentType,
  index: number,
  locale: string,
  termWord: string,
): string {
  // Parse the calendar-date strings as UTC so the month/year rendered by the
  // UTC formatters is not shifted by the browser's local timezone (e.g. a UTC+3
  // local-midnight Aug 1 would otherwise render as July 31 -> "July"). This
  // matches the parsing used by lib/formatters.ts formatDate().
  const start = new Date(periodStart + "T00:00:00Z");
  const end = new Date(dueDate + "T00:00:00Z");
  const startTime = start.getTime();
  if (Number.isNaN(startTime)) return periodStart;

  const monthFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const shortFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "short", timeZone: "UTC" });
  const fullFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

  if (paymentType === "MONTHLY") {
    return monthFmt.format(start);
  }
  if (paymentType === "TERMLY") {
    return `${termWord} ${index + 1} (${shortFmt.format(start)} – ${fullFmt.format(end)})`;
  }
  if (paymentType === "YEARLY") {
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();
    return `${startYear}–${endYear}`;
  }
  return `#${index + 1} (${fullFmt.format(start)})`;
}

export function RecordPaymentDialog({
  open,
  onClose,
  defaultStudentId = null,
  defaultStudentName = null,
}: RecordPaymentDialogProps) {
  const toast = useToast();
  const createPayment = useCreatePayment();
  const { t, tEnum, locale } = useI18n();
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
        targetPeriodStart: "",
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
    setValue("targetPeriodStart", "");
    requestAnimationFrame(() => { groupSelectingRef.current = false; });
  }, [setValue]);
  const enrollmentIdValue = watch("enrollmentId");
  const selectedEnrollment = (enrollments.data?.items ?? []).find(
    (item) => item.id === Number(enrollmentIdValue),
  );

  const handleEnrollmentChange = useCallback((val: string) => {
    enrollmentSelectingRef.current = true;
    setValue("enrollmentId", val, { shouldValidate: true });
    const enrollment = (enrollments.data?.items ?? []).find(
      (item) => item.id === Number(val),
    );
    if (enrollment) {
      setValue("amount", String(Number(enrollment.group.fee)), { shouldValidate: false });
    }
    setValue("targetPeriodStart", "");
    requestAnimationFrame(() => { enrollmentSelectingRef.current = false; });
  }, [enrollments.data, setValue]);

  const availablePeriods = useAvailablePeriods(
    enrollmentIdValue ? Number(enrollmentIdValue) : null,
  );

  const periodOptions = useMemo(() => {
    const periods = availablePeriods.data ?? [];
    const type = selectedEnrollment?.group.paymentType;
    const termWord = t("payments.periodTerm");
    return periods.map((p, index) => ({
      value: p.periodStart,
      dueDate: p.dueDate,
      label: periodLabel(p.periodStart, p.dueDate, type ?? "MONTHLY", index, locale, termWord),
      hint:
        p.status === "PAID"
          ? `${t("payments.periodStatusPaid")} · ${p.totalPaid}`
          : t(periodStatusKey(p.status)),
    }));
  }, [availablePeriods.data, selectedEnrollment, t, locale]);

  // The current (running) period is the one whose window spans today. Periods
  // are ordered oldest -> newest with ISO dates, so it is the first whose due
  // date has not passed yet. Defaulting to it saves the admin from having to
  // open the select each time.
  const defaultPeriodValue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return periodOptions.find((option) => option.dueDate >= today)?.value ?? "";
  }, [periodOptions]);

  const periodValue = watch("targetPeriodStart");
  const effectivePeriodValue = periodValue || defaultPeriodValue;

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      const payload = toPaymentPayload({
        ...values,
        targetPeriodStart: values.targetPeriodStart || effectivePeriodValue,
      });
      await createPayment.mutateAsync(payload);
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
            setError(field as keyof PaymentFormValues, { message: translateFieldMessage(message, t) });
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
        <Field
          label={t("payments.periodLabel")}
          htmlFor="payment-period"
          error={errors.targetPeriodStart?.message}
        >
          <select
            id="payment-period"
            className={`${inputClassName} ${periodOptions.length === 0 ? "text-muted-foreground" : ""}`}
            value={effectivePeriodValue}
            disabled={!selectedEnrollment || availablePeriods.isLoading || periodOptions.length === 0}
            onChange={(e) => setValue("targetPeriodStart", e.target.value, { shouldValidate: true })}
          >
            {availablePeriods.isLoading ? (
              <option value="">{t("common.loading")}</option>
            ) : periodOptions.length === 0 ? (
              <option value="">
                {enrollments.isLoading
                  ? t("common.loading")
                  : !selectedEnrollment
                    ? t("payments.selectGroupFirst")
                    : t("payments.noPeriodsAvailable")}
              </option>
            ) : (
              periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.hint ? ` (${option.hint})` : ""}
                </option>
              ))
            )}
          </select>
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