"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { enrollmentFormSchema, toEnrollmentPayload, type EnrollmentFormValues } from "@/features/enrollments/schema";
import { useGroupsQuery } from "@/features/groups/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";

interface EnrollmentFormDialogProps { open: boolean; onClose: () => void; }

export function EnrollmentFormDialog({ open, onClose }: EnrollmentFormDialogProps) {
  const toast = useToast();
  const createEnrollment = useCreateEnrollment();
  const { t } = useI18n();
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const debouncedStudentSearch = useDebouncedValue(studentSearch.trim());
  const students = useStudentsQuery({
    pageSize: 10,
    status: "ACTIVE",
    search: debouncedStudentSearch || undefined,
  });
  const groups = useGroupsQuery({ pageSize: 100 });
  const [rootError, setRootError] = useState<string | null>(null);
  const { register, handleSubmit, setError, setValue, formState: { errors } } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: { studentId: "", groupId: "", enrollmentDate: new Date().toISOString().slice(0, 10) },
  });
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
        <div className="relative">
          <input
            id="enrollment-student"
            type="search"
            autoComplete="off"
            placeholder={t("enrollments.namePlaceholder")}
            value={studentSearch}
            role="combobox"
            aria-invalid={Boolean(errors.studentId)}
            aria-autocomplete="list"
            aria-expanded={Boolean(debouncedStudentSearch && !selectedStudentId)}
            aria-controls="student-search-results"
            className={inputClassName}
            onChange={(event) => {
              setStudentSearch(event.target.value);
              setSelectedStudentId(null);
              setValue("studentId", "", { shouldValidate: true });
            }}
          />
          {debouncedStudentSearch && !selectedStudentId ? (
            <div id="student-search-results" className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg" role="listbox" aria-label={t("enrollDialog.searchResults")}>
              {students.isLoading ? <p className="px-3 py-2 text-sm text-muted-foreground">{t("common.loading")}</p> : null}
              {!students.isLoading && (students.data?.items.length ?? 0) === 0 ? <p className="px-3 py-2 text-sm text-muted-foreground">{t("enrollments.noActiveStudents")}</p> : null}
              {(students.data?.items ?? []).map((student) => <button key={student.id} type="button" role="option" aria-selected={false} className="block w-full px-3 py-2 text-start text-sm hover:bg-muted" onClick={() => {
                setStudentSearch(`${student.fullName} — ${student.grade}`);
                setSelectedStudentId(student.id);
                setValue("studentId", String(student.id), { shouldValidate: true });
              }}><span className="font-medium text-card-foreground">{student.fullName}</span><span className="ml-2 text-muted-foreground">{student.grade}{student.phone ? ` · ${student.phone}` : ""}</span></button>)}
            </div>
          ) : null}
        </div>
      </Field>
      <Field label="Group" htmlFor="enrollment-group" error={errors.groupId?.message}><select id="enrollment-group" className={inputClassName} aria-invalid={Boolean(errors.groupId)} {...register("groupId")}><option value="">{groups.isLoading ? "Loading groups…" : "Select a group…"}</option>{(groups.data?.items ?? []).map((group) => <option key={group.id} value={group.id}>{group.name} — {group.subject}</option>)}</select></Field>
      <Field label="Enrollment date" htmlFor="enrollment-date" error={errors.enrollmentDate?.message}><input id="enrollment-date" type="date" className={inputClassName} {...register("enrollmentDate")} /></Field>
      <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} disabled={createEnrollment.isPending} className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-60">{t("common.cancel")}</button><button type="submit" disabled={createEnrollment.isPending || groups.isLoading} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">{createEnrollment.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}{t("enrollDialog.submit")}</button></div>
    </form>
  </FormDialog>;
}
