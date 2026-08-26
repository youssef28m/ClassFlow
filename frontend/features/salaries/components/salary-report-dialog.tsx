"use client";

import { Loader2 } from "lucide-react";
import { FormDialog } from "@/components/forms/form-dialog";
import { useSalaryReport } from "@/features/salaries/hooks";
import type { SalaryReport, SalaryReportGroup } from "@/features/salaries/types";
import { useI18n } from "@/lib/i18n/provider";

interface SalaryReportDialogProps {
  open: boolean;
  salaryId: number | null;
  onClose: () => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SalaryReportDialog({
  open,
  salaryId,
  onClose,
}: SalaryReportDialogProps) {
  const { t } = useI18n();
  const { data, isLoading } = useSalaryReport(salaryId);

  return (
    <FormDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={t("salaries.reportTitle")}
      description={data ? `${data.teacherName} — ${t(`months.${MONTHS[data.salaryMonth - 1]?.toLowerCase() ?? "january"}` as "months.january")} ${data.salaryYear}` : ""}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <ReportContent data={data} />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("common.somethingWentWrong")}
        </p>
      )}
    </FormDialog>
  );
}

export function ReportContent({ data }: { data: SalaryReport }) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t("salaries.amount")}</p>
          <p className="font-semibold tabular-nums">
            {Number(data.amount).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t("payments.currency")}</span>
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t("salaries.totalPayments")}</p>
          <p className="font-semibold tabular-nums">
            {Number(data.paymentSum).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{t("payments.currency")}</span>
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t("salaries.percentage")}</p>
          <p className="font-semibold tabular-nums">{Number(data.percentage)}%</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t("salaries.reportTotalStudents")}</p>
          <p className="font-semibold tabular-nums">{data.totalStudents}</p>
        </div>
      </div>

      {data.groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("salaries.reportNoGroups")}
        </p>
      ) : (
        data.groups.map((group) => (
          <GroupSection key={group.groupId} group={group} />
        ))
      )}
    </div>
  );
}

function GroupSection({ group }: { group: SalaryReportGroup }) {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <div>
          <span className="text-sm font-medium text-card-foreground">
            {group.groupName}
          </span>
          <span className="ms-2 text-xs text-muted-foreground">
            ({group.subject})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
          <span>
            {group.studentCount} {t("salaries.reportStudents")}
          </span>
          <span className="font-medium text-card-foreground">
            {Number(group.groupTotal).toLocaleString()} {t("payments.currency")}
          </span>
        </div>
      </div>

      {group.students.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">
          {t("salaries.reportNoPayments")}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {group.students.map((student) => (
            <div key={student.studentId} className="px-3 py-2.5">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-card-foreground">
                    {student.studentName}
                  </span>
                  {student.grade ? (
                    <span className="ms-2 text-xs text-muted-foreground">
                      {student.grade}
                    </span>
                  ) : null}
                </div>
                <span className="font-medium tabular-nums text-card-foreground">
                  {Number(student.totalPaid).toLocaleString()}{" "}
                  <span className="text-xs text-muted-foreground">{t("payments.currency")}</span>
                </span>
              </div>
              {student.payments.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {student.payments.map((payment) => (
                    <span
                      key={payment.id}
                      className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-xs tabular-nums text-muted-foreground"
                    >
                      <span>{Number(payment.amount).toLocaleString()} {t("payments.currency")}</span>
                      <span className="text-border">·</span>
                      <span>{payment.paymentDate}</span>
                      <span className="text-border">·</span>
                      <span>{payment.method}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
