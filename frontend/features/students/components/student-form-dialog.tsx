"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Field,
  inputClassName,
} from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import {
  studentFormSchema,
  toStudentFormValues,
  toStudentPayload,
  type StudentFormValues,
} from "@/features/students/schema";
import type { Student } from "@/features/students/types";
import { STUDENT_STATUSES } from "@/features/students/types";
import { ApiError } from "@/lib/api-client";
import { humanizeEnum } from "@/lib/formatters";
import {
  useCreateStudent,
  useUpdateStudent,
} from "@/features/students/hooks";

interface StudentFormDialogProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
}

function defaultValues(): StudentFormValues {
  return {
    fullName: "",
    phone: "",
    parentPhone: "",
    grade: "",
    school: "",
    joinDate: new Date().toISOString().slice(0, 10),
    status: "ACTIVE",
    notes: "",
  };
}

export function StudentFormDialog({
  open,
  onClose,
  student,
}: StudentFormDialogProps) {
  const isEdit = Boolean(student);
  const toast = useToast();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const [rootError, setRootError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => (student ? toStudentFormValues(student) : defaultValues()),
    [student],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    const payload = toStudentPayload(values);
    try {
      if (student) {
        await updateStudent.mutateAsync({ id: student.id, payload });
        toast.success("Student updated");
      } else {
        await createStudent.mutateAsync(payload);
        toast.success("Student added");
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in studentFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof StudentFormValues, { message });
          }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else {
        setRootError("Something went wrong. Please try again.");
      }
    }
  });

  const isSaving = createStudent.isPending || updateStudent.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isEdit ? `Edit ${student?.fullName}` : "Add student"}
      description={
        isEdit
          ? "Update the student record. Changes apply immediately."
          : "Create a new student record for your center."
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

        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <input
            id="fullName"
            type="text"
            autoComplete="off"
            placeholder="e.g. Ahmed Mohamed"
            aria-invalid={Boolean(errors.fullName)}
            className={inputClassName}
            {...register("fullName")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <input
              id="phone"
              type="tel"
              placeholder="Optional"
              aria-invalid={Boolean(errors.phone)}
              className={inputClassName}
              {...register("phone")}
            />
          </Field>
          <Field
            label="Parent phone"
            htmlFor="parentPhone"
            error={errors.parentPhone?.message}
          >
            <input
              id="parentPhone"
              type="tel"
              placeholder="Optional"
              aria-invalid={Boolean(errors.parentPhone)}
              className={inputClassName}
              {...register("parentPhone")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Grade" htmlFor="grade" error={errors.grade?.message}>
            <input
              id="grade"
              type="text"
              placeholder="e.g. Grade 7"
              aria-invalid={Boolean(errors.grade)}
              className={inputClassName}
              {...register("grade")}
            />
          </Field>
          <Field label="School" htmlFor="school" error={errors.school?.message}>
            <input
              id="school"
              type="text"
              placeholder="Optional"
              aria-invalid={Boolean(errors.school)}
              className={inputClassName}
              {...register("school")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Join date"
            htmlFor="joinDate"
            error={errors.joinDate?.message}
          >
            <input
              id="joinDate"
              type="date"
              aria-invalid={Boolean(errors.joinDate)}
              className={inputClassName}
              {...register("joinDate")}
            />
          </Field>
          <Field
            label="Status"
            htmlFor="status"
            error={errors.status?.message}
          >
            <select
              id="status"
              aria-invalid={Boolean(errors.status)}
              className={inputClassName}
              {...register("status")}
            >
              {STUDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {humanizeEnum(status)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
          <textarea
            id="notes"
            rows={3}
            placeholder="Optional"
            aria-invalid={Boolean(errors.notes)}
            className={`${inputClassName} h-auto py-2`}
            {...register("notes")}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {isEdit ? "Save changes" : "Add student"}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
