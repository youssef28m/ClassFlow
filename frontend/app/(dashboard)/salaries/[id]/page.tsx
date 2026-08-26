"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ReportContent } from "@/features/salaries/components/salary-report-dialog";
import { useSalaryReport } from "@/features/salaries/hooks";
import { useI18n } from "@/lib/i18n/provider";

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

export default function SalaryReportPage() {
  const params = useParams<{ id: string }>();
  const salaryId = Number(params.id);
  const { t } = useI18n();
  const { data, isLoading, error } = useSalaryReport(salaryId);

  const monthLabel = data
    ? t(`months.${MONTHS[data.salaryMonth - 1]?.toLowerCase() ?? "january"}` as "months.january")
    : "";

  return (
    <>
      <PageHeader
        title={t("salaries.reportTitle")}
        description={data ? `${data.teacherName} — ${monthLabel} ${data.salaryYear}` : ""}
        actions={
          <Link
            href="/salaries"
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("common.backToDashboard")}
          </Link>
        }
      />

      <section className="rounded-xl border border-border bg-card p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("common.somethingWentWrong")}
          </p>
        ) : data ? (
          <ReportContent data={data} />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("common.somethingWentWrong")}
          </p>
        )}
      </section>
    </>
  );
}
