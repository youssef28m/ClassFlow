"use client";

import { ExportButtons } from "@/components/export/export-buttons";
import { useToast } from "@/components/feedback/toast";
import type { SalaryReport } from "@/features/salaries/types";
import { PAYMENT_METHODS, type PaymentMethod } from "@/features/payments/types";
import { ApiError } from "@/lib/api-client";
import { downloadCSV, openPrintWindow, type PrintSection } from "@/lib/export";
import { formatDate, humanizeEnum } from "@/lib/formatters";
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
] as const;

export function SalaryReportExportActions({ report }: { report: SalaryReport }) {
  const toast = useToast();
  const { t, tEnum } = useI18n();

  const monthKey = MONTHS[report.salaryMonth - 1]?.toLowerCase() ?? "january";
  const monthLabel = t(`months.${monthKey}` as "months.january");
  const title = `${report.teacherName} — ${monthLabel} ${report.salaryYear}`;

  const methodLabel = (method: string): string =>
    (PAYMENT_METHODS as readonly string[]).includes(method)
      ? tEnum(method as PaymentMethod)
      : humanizeEnum(method);

  const meta: Array<{ label: string; value: string }> = [
    { label: t("salaries.amount"), value: `${Number(report.amount).toLocaleString()}` },
    { label: t("salaries.totalPayments"), value: `${Number(report.paymentSum).toLocaleString()}` },
    { label: t("salaries.percentage"), value: `${Number(report.percentage)}%` },
    { label: t("salaries.reportTotalStudents"), value: `${report.totalStudents}` },
  ];

  const printSections: PrintSection[] = report.groups.map((group) => ({
    heading: group.groupName,
    table: {
      headers: [
        t("students.columnName"),
        t("students.columnGrade"),
        t("payments.amount"),
      ],
      rows: group.students.map((student) => [
        student.studentName,
        student.grade ?? "—",
        Number(student.totalPaid),
      ]),
    },
  }));

  const csvFilename = `salary-${report.teacherName.replace(/\s+/g, "-")}-${report.salaryMonth}-${report.salaryYear}.csv`;
  const csvHeaders = [
    t("payments.columnGroup"),
    t("students.columnName"),
    t("students.columnGrade"),
    t("payments.columnDate"),
    t("payments.method"),
    t("payments.amount"),
  ];
  const csvRows: Array<Array<string | number>> = report.groups.flatMap((group) =>
    group.students.flatMap((student) =>
      student.payments.map((payment) => [
        group.groupName,
        student.studentName,
        student.grade ?? "",
        payment.paymentDate,
        methodLabel(payment.method),
        Number(payment.amount),
      ]),
    ),
  );

  function handleExportCsv() {
    try {
      downloadCSV(csvFilename, csvHeaders, csvRows);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
    }
  }

  function handleExportPdf() {
    openPrintWindow(
      title,
      t("export.generatedOn", { date: formatDate(new Date().toISOString()) }),
      meta,
      printSections,
    );
  }

  return (
    <ExportButtons
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    />
  );
}