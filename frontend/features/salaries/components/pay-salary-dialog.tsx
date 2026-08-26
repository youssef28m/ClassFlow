"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import { usePaySalary } from "@/features/salaries/hooks";
import type { SalaryCalculationEntry } from "@/features/salaries/types";
import { useI18n } from "@/lib/i18n/provider";

interface PaySalaryDialogProps {
  open: boolean;
  entry: SalaryCalculationEntry | null;
  from: string;
  to: string;
  percentage: number;
  onClose: () => void;
}

export function PaySalaryDialog({
  open,
  entry,
  from,
  to,
  percentage,
  onClose,
}: PaySalaryDialogProps) {
  const { t } = useI18n();
  const toast = useToast();
  const today = new Date().toISOString().split("T")[0] as string;
  const [paymentDate, setPaymentDate] = useState(today);
  const [notes, setNotes] = useState("");

  const paySalary = usePaySalary();

  async function handlePay() {
    if (!entry) return;

    try {
      await paySalary.mutateAsync({
        teacherId: entry.teacherId,
        from,
        to,
        percentage,
        paymentDate,
        notes: notes.trim() || null,
      });

      toast.success(t("salaries.paySuccess"));
      handleClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : t("salaries.payError");
      toast.error(message);
    }
  }

  function handleClose() {
    setPaymentDate(today);
    setNotes("");
    onClose();
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
      title={t("salaries.payTitle")}
      description={
        entry ? `${entry.teacherName} — ${Number(entry.calculatedSalary).toLocaleString()} ${t("payments.currency")}` : ""
      }
    >
      {entry && (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">{t("salaries.totalPayments")}: </span>
                <span className="font-medium tabular-nums">
                  {Number(entry.totalPayments).toLocaleString()} {t("payments.currency")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("salaries.salaryAmount")}: </span>
                <span className="font-medium tabular-nums">
                  {Number(entry.calculatedSalary).toLocaleString()} {t("payments.currency")}
                </span>
              </div>
            </div>
          </div>
          <Field label={t("salaries.paymentDate")} htmlFor="pay-date">
            <input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label={t("salaries.notes")} htmlFor="pay-notes">
            <textarea
              id="pay-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClassName} h-auto py-2`}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={paySalary.isPending}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={paySalary.isPending}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
            >
              {paySalary.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {t("salaries.payConfirm")}
            </button>
          </div>
        </div>
      )}
    </FormDialog>
  );
}
