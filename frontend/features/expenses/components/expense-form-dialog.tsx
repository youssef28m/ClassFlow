"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import {
  expenseFormSchema,
  toExpenseFormValues,
  toExpensePayload,
  type ExpenseFormValues,
} from "@/features/expenses/schema";
import type { Expense } from "@/features/expenses/types";
import { EXPENSE_CATEGORIES } from "@/features/expenses/types";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";
import {
  useCreateExpense,
  useUpdateExpense,
} from "@/features/expenses/hooks";

interface ExpenseFormDialogProps {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
}

function defaultValues(): ExpenseFormValues {
  return {
    category: "OTHER",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
  };
}

export function ExpenseFormDialog({
  open,
  onClose,
  expense,
}: ExpenseFormDialogProps) {
  const isEdit = Boolean(expense);
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const [rootError, setRootError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => (expense ? toExpenseFormValues(expense) : defaultValues()),
    [expense],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: initialValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    setRootError(null);
    const payload = toExpensePayload(values);
    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, payload });
        toast.success(t("expenses.updated"));
      } else {
        await createExpense.mutateAsync(payload);
        toast.success(t("expenses.created"));
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        let hasFieldErrors = false;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const message = messages[0];
          if (message && field in expenseFormSchema.shape) {
            hasFieldErrors = true;
            setError(field as keyof ExpenseFormValues, { message });
          }
        }
        if (!hasFieldErrors) setRootError(error.message);
      } else {
        setRootError(t("common.somethingWentWrong"));
      }
    }
  });

  const isSaving = createExpense.isPending || updateExpense.isPending;

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={isEdit ? t("expenses.editTitle") : t("expenses.addTitle")}
      description={
        isEdit ? t("expenses.formEditDescription") : t("expenses.formAddDescription")
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={t("expenses.fieldCategory")}
            htmlFor="category"
            error={errors.category?.message}
          >
            <select
              id="category"
              aria-invalid={Boolean(errors.category)}
              className={inputClassName}
              {...register("category")}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {tEnum(cat)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t("expenses.fieldAmount")}
            htmlFor="amount"
            error={errors.amount?.message}
          >
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
              className={inputClassName}
              {...register("amount")}
            />
          </Field>
        </div>

        <Field
          label={t("expenses.fieldDate")}
          htmlFor="expenseDate"
          error={errors.expenseDate?.message}
        >
          <input
            id="expenseDate"
            type="date"
            aria-invalid={Boolean(errors.expenseDate)}
            className={inputClassName}
            {...register("expenseDate")}
          />
        </Field>

        <Field
          label={t("expenses.fieldDescription")}
          htmlFor="description"
          error={errors.description?.message}
        >
          <textarea
            id="description"
            rows={3}
            placeholder={t("common.optional")}
            aria-invalid={Boolean(errors.description)}
            className={`${inputClassName} h-auto py-2`}
            {...register("description")}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {isEdit ? t("common.saveChanges") : t("expenses.submit")}
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
