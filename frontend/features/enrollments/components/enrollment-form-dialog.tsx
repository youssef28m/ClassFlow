"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { useToast } from "@/components/feedback/toast";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { enrollmentFormSchema, toEnrollmentPayload, type EnrollmentFormValues } from "@/features/enrollments/schema";
import { useGroupsQuery } from "@/features/groups/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface EnrollmentFormDialogProps { open: boolean; onClose: () => void; }

export function EnrollmentFormDialog({ open, onClose }: EnrollmentFormDialogProps) {
  const toast = useToast();
  const createEnrollment = useCreateEnrollment();
  const { t } = useI18n();
  const [studentSearch, setStudentSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const studentSelectingRef = useRef(false);
  const groupSelectingRef = useRef(false);
  const students = useStudentsQuery({
    pageSize: 100,
    status: "ACTIVE",
    ...(studentSearch ? { search: studentSearch } : {}),
  });
  const groups = useGroupsQuery({
    pageSize: 100,
    ...(groupSearch ? { search: groupSearch } : {}),
  });
  const [rootError, setRootError] = useState<string | null>(null);
  const handleStudentSearch = useCallback((q: string) => {
    if (!studentSelectingRef.current) setStudentSearch(q);
  }, []);
  const handleGroupSearch = useCallback((q: string) => {
    if (!groupSelectingRef.current) setGroupSearch(q);
  }, []);
  const { register, handleSubmit, setError, setValue, watch, formState: { errors } } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: { studentId: "", groupId: "", enrollmentDate: new Date().toISOString().slice(0, 10) },
  });
  const handleStudentChange = useCallback((val: string) => {
    studentSelectingRef.current = true;
    setValue("studentId", val, { shouldValidate: true });
    requestAnimationFrame(() => { studentSelectingRef.current = false; });
  }, [setValue]);
  const handleGroupChange = useCallback((val: string) => {
    groupSelectingRef.current = true;
    setValue("groupId", val, { shouldValidate: true });
    requestAnimationFrame(() => { groupSelectingRef.current = false; });
  }, [setValue]);
  const studentIdValue = watch("studentId");
  const groupIdValue = watch("groupId");
  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try { await createEnrollment.mutateAsync(toEnrollmentPayload(values)); toast.success(t("groupDetail.enrolledGeneric")); onClose(); }
    catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in enrollmentFormSchema.shape) { hasFieldErrors = true; setError(field as keyof EnrollmentFormValues, { message }); }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else setRootError("Something went wrong. Please try again.");
    }
  });

  return <FormDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} title={t("enrollDialog.submit")} description={t("enrollments.formDescription")}>
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {rootError ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{rootError}</p> : null}
      <Field label={t("students.columnName")} htmlFor="enrollment-student" error={errors.studentId?.message} hint={t("enrollments.hintSearchByName")}>
        <input type="hidden" {...register("studentId")} />
        <SearchableSelect
          value={studentIdValue}
          onChange={handleStudentChange}
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
          onSearch={handleStudentSearch}
        />
      </Field>
      <Field label="Group" htmlFor="enrollment-group" error={errors.groupId?.message}>
        <input type="hidden" {...register("groupId")} />
        <SearchableSelect
          value={groupIdValue}
          onChange={handleGroupChange}
          placeholder={groups.isLoading ? t("common.loading") : t("groups.selectTeacherPlaceholder")}
          searchPlaceholder={t("groups.searchPlaceholder")}
          emptyText={t("groups.emptyFiltered")}
          loading={groups.isLoading}
          className="min-w-65"
          options={(groups.data?.items ?? []).map((g) => ({
            value: g.id,
            label: g.name,
            hint: g.subject,
          }))}
          onSearch={handleGroupSearch}
        />
      </Field>
      <Field label="Enrollment date" htmlFor="enrollment-date" error={errors.enrollmentDate?.message}><input id="enrollment-date" type="date" className={inputClassName} {...register("enrollmentDate")} /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={createEnrollment.isPending} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-60">{t("common.cancel")}</button><button type="submit" disabled={createEnrollment.isPending || groups.isLoading} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">{createEnrollment.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}{t("enrollDialog.submit")}</button></div>
    </form>
  </FormDialog>;
}
