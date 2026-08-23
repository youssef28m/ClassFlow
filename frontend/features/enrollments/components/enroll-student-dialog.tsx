"use client";

import { Check, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FormDialog } from "@/components/forms/form-dialog";
import { inputClassName } from "@/components/forms/field";
import { useToast } from "@/components/feedback/toast";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import type { Student } from "@/features/students/types";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";

interface EnrollStudentDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
  enrolledStudentIds: number[];
}

export function EnrollStudentDialog({
  open,
  onClose,
  groupId,
  groupName,
  enrolledStudentIds,
}: EnrollStudentDialogProps) {
  const toast = useToast();
  const enroll = useCreateEnrollment();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [rootError, setRootError] = useState<string | null>(null);
  const search = useDebouncedValue(query);

  const students = useStudentsQuery({ search: search || undefined, pageSize: 10 });

  const results = useMemo(
    () =>
      (students.data?.items ?? []).filter(
        (student) => !enrolledStudentIds.includes(student.id),
      ),
    [students.data, enrolledStudentIds],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) {
      setRootError(t("enrollDialog.selectFirst"));
      return;
    }
    setRootError(null);
    try {
      await enroll.mutateAsync({
        studentId: selected.id,
        groupId,
      });
      toast.success(t("groupDetail.enrolledToast", { name: selected.fullName }));
      onClose();
    } catch (error) {
      setRootError(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={t("enrollDialog.title", { group: groupName })}
      description={t("enrollDialog.description")}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {rootError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {rootError}
          </p>
        ) : null}

        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="enroll-student-search"
            type="search"
            placeholder={t("enrollDialog.searchPlaceholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            autoComplete="off"
            className={`${inputClassName} ps-9`}
            aria-label={t("enrollDialog.searchPlaceholder")}
          />
        </div>

        <div
          role="listbox"
          aria-label={t("enrollDialog.searchResults")}
          className="scroll-slim max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-1.5"
        >
          {students.isLoading ? (
            <p className="flex items-center gap-2 rounded-lg px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("common.loading")}
            </p>
          ) : students.error ? (
            <p role="alert" className="rounded-lg px-3 py-6 text-sm text-red-600 dark:text-red-400">
              {t("enrollDialog.loadError")}
            </p>
          ) : results.length === 0 ? (
            <p className="rounded-lg px-3 py-6 text-sm text-muted-foreground">
              {search && !students.isFetching
                ? t("enrollDialog.noMatches")
                : query !== search
                  ? t("common.loading")
                  : t("enrollDialog.allEnrolled")}
            </p>
          ) : (
            results.map((student) => {
              const isSelected = selected?.id === student.id;
              return (
                <button
                  key={student.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelected(student)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start transition-colors ${
                    isSelected
                      ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
                      : "text-card-foreground hover:bg-background"
                  }`}
                >
                  <span className="truncate text-sm font-medium">{student.fullName}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {student.grade}
                    {isSelected ? <Check className="size-4 text-primary" aria-hidden /> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {selected
            ? t("enrollDialog.selected", { name: selected.fullName })
            : t("enrollDialog.availableCount", {
              count: `${results.length}${students.data && students.data.meta.total > 10 ? "+" : ""}`,
            })}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={enroll.isPending}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={enroll.isPending || !selected}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {enroll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {t("enrollDialog.submit")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
