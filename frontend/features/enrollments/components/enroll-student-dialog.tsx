"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FormDialog } from "@/components/forms/form-dialog";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { useToast } from "@/components/feedback/toast";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

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
  const [selectedId, setSelectedId] = useState("");
  const [rootError, setRootError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const selectingRef = useRef(false);
  const students = useStudentsQuery({
    pageSize: 50,
    ...(search ? { search } : {}),
  });

  const options = useMemo(
    () =>
      (students.data?.items ?? [])
        .filter((student) => !enrolledStudentIds.includes(student.id))
        .map((student) => ({
          value: String(student.id),
          label: student.fullName,
          hint: student.grade,
        })),
    [students.data, enrolledStudentIds],
  );

  const handleSearch = useCallback((query: string) => {
    if (!selectingRef.current) {
      setSearch(query);
    }
  }, []);

  const handleChange = useCallback((value: string) => {
    selectingRef.current = true;
    setSelectedId(value);
    requestAnimationFrame(() => {
      selectingRef.current = false;
    });
  }, []);

  const selected = useMemo(
    () => options.find((option) => option.value === selectedId),
    [options, selectedId],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) {
      setRootError(t("enrollDialog.selectFirst"));
      return;
    }
    setRootError(null);
    try {
      await enroll.mutateAsync({
        studentId: Number(selectedId),
        groupId,
      });
      toast.success(t("groupDetail.enrolledToast", { name: selected?.label ?? "" }));
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

        <SearchableSelect
          value={selectedId}
          onChange={handleChange}
          placeholder={t("enrollDialog.searchPlaceholder")}
          searchPlaceholder={t("enrollDialog.searchPlaceholder")}
          emptyText={t("enrollDialog.allEnrolled")}
          loading={students.isLoading}
          className="w-full"
          options={options}
          onSearch={handleSearch}
        />

        <p className="min-h-5 text-xs text-muted-foreground" aria-live="polite">
          {selected
            ? t("enrollDialog.selected", { name: selected.label })
            : t("enrollDialog.availableCount", {
                count: students.data?.meta.total ?? options.length,
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
            disabled={enroll.isPending || !selectedId}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {t("enrollDialog.submit")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}