"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import {
  teacherFormSchema,
  toTeacherFormValues,
  toTeacherPayload,
  type TeacherFormValues,
} from "@/features/teachers/schema";
import type { Teacher } from "@/features/teachers/types";
import { useCreateTeacher, useUpdateTeacher } from "@/features/teachers/hooks";
import { ApiError } from "@/lib/api-client";

interface TeacherFormDialogProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
}

function defaultValues(): TeacherFormValues {
  return { fullName: "", phone: "", specialization: "", active: true };
}

export function TeacherFormDialog({ open, onClose, teacher }: TeacherFormDialogProps) {
  const toast = useToast();
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const [rootError, setRootError] = useState<string | null>(null);
  const initialValues = useMemo(
    () => (teacher ? toTeacherFormValues(teacher) : defaultValues()),
    [teacher],
  );
  const { register, handleSubmit, setError, formState: { errors } } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    try {
      if (teacher) {
        await updateTeacher.mutateAsync({ id: teacher.id, payload: toTeacherPayload(values) });
        toast.success("Teacher updated");
      } else {
        await createTeacher.mutateAsync(toTeacherPayload(values));
        toast.success("Teacher added");
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in teacherFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof TeacherFormValues, { message });
          }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else {
        setRootError("Something went wrong. Please try again.");
      }
    }
  });
  const isSaving = createTeacher.isPending || updateTeacher.isPending;

  return (
    <FormDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} title={teacher ? `Edit ${teacher.fullName}` : "Add teacher"} description="Manage the teacher's contact details and specialization.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {rootError ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{rootError}</p> : null}
        <Field label="Full name" htmlFor="teacher-full-name" error={errors.fullName?.message}>
          <input id="teacher-full-name" type="text" autoComplete="name" className={inputClassName} aria-invalid={Boolean(errors.fullName)} {...register("fullName")} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="teacher-phone" error={errors.phone?.message}>
            <input id="teacher-phone" type="tel" autoComplete="tel" className={inputClassName} aria-invalid={Boolean(errors.phone)} {...register("phone")} />
          </Field>
          <Field label="Specialization" htmlFor="teacher-specialization" error={errors.specialization?.message}>
            <input id="teacher-specialization" type="text" className={inputClassName} aria-invalid={Boolean(errors.specialization)} {...register("specialization")} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-card-foreground">
          <input type="checkbox" className="size-4 accent-primary" {...register("active")} />
          Active teacher
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={isSaving} className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={isSaving} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">
            {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}{teacher ? "Save changes" : "Add teacher"}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
