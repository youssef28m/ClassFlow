"use client";

import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FormDialog } from "@/components/forms/form-dialog";
import { inputClassName } from "@/components/forms/field";
import { useToast } from "@/components/feedback/toast";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import type { Student } from "@/features/students/types";
import { ApiError } from "@/lib/api-client";
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
      setRootError("Search for and select a student to enroll.");
      return;
    }
    setRootError(null);
    try {
      await enroll.mutateAsync({
        studentId: selected.id,
        groupId,
      });
      toast.success(`${selected.fullName} enrolled`);
      onClose();
    } catch (error) {
      setRootError(
        error instanceof ApiError ? error.message : "Failed to enroll student.",
      );
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={`Add student to ${groupName}`}
      description="Search by name, then select the student to enroll in this group."
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
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="enroll-student-search"
            type="search"
            placeholder="Search students by name…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            autoComplete="off"
            className={`${inputClassName} pl-9`}
            aria-label="Search students by name"
          />
        </div>

        <div
          role="listbox"
          aria-label="Search results"
          className="max-h-64 divide-y divide-border overflow-y-auto rounded-xl border border-border"
        >
          {students.isLoading ? (
            <p className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching…
            </p>
          ) : students.error ? (
            <p role="alert" className="px-4 py-6 text-sm text-red-600 dark:text-red-400">
              Could not load students. Try again.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {search && !students.isFetching
                ? "No matching students."
                : query !== search
                  ? "Searching…"
                  : "All students are already enrolled."}
            </p>
          ) : (
            results.map((student) => (
              <button
                key={student.id}
                type="button"
                role="option"
                aria-selected={selected?.id === student.id}
                onClick={() => setSelected(student)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted ${
                  selected?.id === student.id ? "bg-primary/10" : ""
                }`}
              >
                <span className="truncate text-sm font-medium text-card-foreground">
                  {student.fullName}
                </span>
                {student.grade ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {student.grade}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {selected
            ? `Selected: ${selected.fullName}`
            : `${results.length}${students.data && students.data.meta.total > 10 ? "+" : ""} available`}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={enroll.isPending}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={enroll.isPending || !selected}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {enroll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Enroll student
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
