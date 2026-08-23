"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import { useCreateEnrollment } from "@/features/enrollments/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { ApiError } from "@/lib/api-client";

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
  const students = useStudentsQuery({ pageSize: 100 });
  const [studentId, setStudentId] = useState("");
  const [rootError, setRootError] = useState<string | null>(null);

  const available = useMemo(
    () =>
      (students.data?.items ?? []).filter(
        (student) => !enrolledStudentIds.includes(student.id),
      ),
    [students.data, enrolledStudentIds],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!studentId) {
      setRootError("Select a student to enroll.");
      return;
    }
    setRootError(null);
    try {
      await enroll.mutateAsync({
        studentId: Number(studentId),
        groupId,
      });
      toast.success("Student enrolled");
      setStudentId("");
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
      description="Pick a student from your center to enroll in this group."
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

        <Field label="Student" htmlFor="enroll-student">
          <select
            id="enroll-student"
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className={inputClassName}
          >
            <option value="">
              {students.isLoading
                ? "Loading students…"
                : available.length === 0
                  ? "All students are already enrolled"
                  : "Select a student…"}
            </option>
            {available.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
                {student.grade ? ` — ${student.grade}` : ""}
              </option>
            ))}
          </select>
        </Field>

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
            disabled={enroll.isPending || available.length === 0}
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
