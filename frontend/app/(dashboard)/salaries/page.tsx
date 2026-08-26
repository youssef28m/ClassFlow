"use client";

import { Calculator, Check, Loader2, Trash2, CalendarDays, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { inputClassName } from "@/components/forms/field";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { TablePagination } from "@/components/tables/table-pagination";
import { PaySalaryDialog } from "@/features/salaries/components/pay-salary-dialog";
import {
  useCalculateSalary,
  useDeleteSalary,
  useSalariesQuery,
  useUpdateSalary,
} from "@/features/salaries/hooks";
import type {
  Salary,
  SalaryCalculationEntry,
} from "@/features/salaries/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";

const PAGE_SIZE = 10;

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

function getMonthOptions(t: ReturnType<typeof useI18n>["t"]) {
  return MONTHS.map((m, i) => ({
    value: i + 1,
    label: t(`months.${m.toLowerCase()}` as "months.january"),
  }));
}

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lastMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: dateToStr(firstOfPrevMonth), to: dateToStr(lastOfPrevMonth) };
}

function last30DaysRange(): { from: string; to: string } {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  return { from: dateToStr(thirtyDaysAgo), to: dateToStr(now) };
}

export default function SalariesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useI18n();

  const [monthFilter, setMonthFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [paidFilter, setPaidFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const deleteSalary = useDeleteSalary();
  const updateSalary = useUpdateSalary();

  const [calcFrom, setCalcFrom] = useState("");
  const [calcTo, setCalcTo] = useState("");
  const [calcPercentage, setCalcPercentage] = useState("70");
  const [calcParams, setCalcParams] = useState<{
    from: string;
    to: string;
    percentage: number;
  } | null>(null);

  const [payEntry, setPayEntry] = useState<{
    entry: SalaryCalculationEntry;
    from: string;
    to: string;
    percentage: number;
  } | null>(null);
  const [deletingSalary, setDeletingSalary] = useState<Salary | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      salaryMonth: monthFilter ? Number(monthFilter) : undefined,
      salaryYear: yearFilter ? Number(yearFilter) : undefined,
      isPaid: paidFilter ? paidFilter === "true" : undefined,
    }),
    [page, monthFilter, yearFilter, paidFilter],
  );

  const { data, isLoading, error, refetch } = useSalariesQuery(filters);
  const monthOptions = getMonthOptions(t);

  const calcEnabled = Boolean(calcParams);
  const { data: calcResult, isLoading: calcLoading } = useCalculateSalary({
    from: calcParams?.from ?? "",
    to: calcParams?.to ?? "",
    percentage: calcParams?.percentage ?? 70,
    enabled: calcEnabled,
  });

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  function handleCalculate() {
    if (!calcFrom || !calcTo) {
      toast.error(t("salaries.selectDates"));
      return;
    }
    const pct = Number(calcPercentage) || 70;
    setCalcParams({ from: calcFrom, to: calcTo, percentage: pct });
  }

  async function handleConfirmDelete() {
    if (!deletingSalary) return;
    try {
      await deleteSalary.mutateAsync(deletingSalary.id);
      toast.success(t("salaries.deleted"));
      setDeletingSalary(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : t("common.somethingWentWrong"),
      );
      setDeletingSalary(null);
    }
  }

  async function handleMarkPaid(salary: Salary) {
    try {
      await updateSalary.mutateAsync({
        id: salary.id,
        payload: { isPaid: true },
      });
      toast.success(t("salaries.markedPaid"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("common.somethingWentWrong"),
      );
    }
  }

  function handlePayEntry(entry: SalaryCalculationEntry) {
    setPayEntry({
      entry,
      from: calcParams!.from,
      to: calcParams!.to,
      percentage: calcParams!.percentage,
    });
  }

  const columns: DataTableColumn<Salary>[] = [
    {
      key: "teacherName",
      header: t("teachers.columnName"),
      render: (salary) => (
        <span className="font-medium">{salary.teacherName ?? "—"}</span>
      ),
    },
    {
      key: "salaryMonth",
      header: t("salaries.month"),
      render: (salary) => {
        const monthIdx = salary.salaryMonth - 1;
        return (
          <span>
            {t(`months.${MONTHS[monthIdx]?.toLowerCase() ?? "january"}` as "months.january")}{" "}
            {salary.salaryYear}
          </span>
        );
      },
    },
    {
      key: "paymentSum",
      header: t("salaries.totalPayments"),
      render: (salary) => (
        <span className="tabular-nums text-muted-foreground">
          {Number(salary.paymentSum).toLocaleString()} {t("payments.currency")}
        </span>
      ),
    },
    {
      key: "percentage",
      header: t("salaries.percentage"),
      render: (salary) => (
        <span className="tabular-nums">{Number(salary.percentage)}%</span>
      ),
    },
    {
      key: "amount",
      header: t("salaries.amount"),
      render: (salary) => (
        <span className="font-medium tabular-nums">
          {Number(salary.amount).toLocaleString()}{" "}
          <span className="text-muted-foreground">{t("payments.currency")}</span>
        </span>
      ),
    },
    {
      key: "isPaid",
      header: t("salaries.status"),
      render: (salary) =>
        salary.isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
            <Check className="size-3" aria-hidden />
            {t("salaries.paid")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            {t("salaries.unpaid")}
          </span>
        ),
    },
    {
      key: "paymentDate",
      header: t("salaries.paymentDate"),
      className: "hidden md:table-cell",
      render: (salary) =>
        salary.isPaid ? formatDate(salary.paymentDate) : "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-end",
      render: (salary) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/salaries/${salary.id}`}
            aria-label={t("salaries.viewReport")}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <FileText className="size-4" aria-hidden />
          </Link>
          {!salary.isPaid &&
          can(user, "teachersAndSalaries", "manageSalaries") ? (
            <button
              type="button"
              aria-label={t("salaries.markPaid")}
              onClick={() => void handleMarkPaid(salary)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
            >
              <Check className="size-4" aria-hidden />
            </button>
          ) : null}
          {can(user, "teachersAndSalaries", "manageSalaries") ? (
            <button
              type="button"
              aria-label={t("common.delete")}
              onClick={() => setDeletingSalary(salary)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("salaries.title")}
        description={t("salaries.description")}
      />

      <PermissionGate resource="teachersAndSalaries" action="manageSalaries">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-card-foreground">
              {t("salaries.calculateTitle")}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const range = last30DaysRange();
                  setCalcFrom(range.from);
                  setCalcTo(range.to);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
              >
                <CalendarDays className="size-3.5" aria-hidden />
                {t("salaries.last30Days")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const range = lastMonthRange();
                  setCalcFrom(range.from);
                  setCalcTo(range.to);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
              >
                <CalendarDays className="size-3.5" aria-hidden />
                {t("salaries.lastMonth")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="calc-from"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                {t("salaries.from")}
              </label>
              <input
                id="calc-from"
                type="date"
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-card-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="calc-to"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                {t("salaries.to")}
              </label>
              <input
                id="calc-to"
                type="date"
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-card-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="w-full sm:w-36">
              <label
                htmlFor="calc-percentage"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                {t("salaries.percentage")}
              </label>
              <div className="relative">
                <input
                  id="calc-percentage"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={calcPercentage}
                  onChange={(e) => setCalcPercentage(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background ps-3 pe-8 text-sm tabular-nums text-card-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCalculate}
              disabled={!calcFrom || !calcTo || calcLoading}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
            >
              {calcLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Calculator className="size-4" aria-hidden />
              )}
              {t("salaries.calculate")}
            </button>
          </div>

          {calcParams && (
            <div className="mt-4">
              {calcLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : calcResult && calcResult.teachers.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                          {t("teachers.columnName")}
                        </th>
                        <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                          {t("salaries.totalPayments")}
                        </th>
                        <th className="px-3 py-2 text-end font-medium text-muted-foreground">
                          {t("salaries.salaryAmount")}
                        </th>
                        <th className="px-3 py-2 text-end" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {calcResult.teachers.map((entry) => (
                        <tr key={entry.teacherId} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-medium text-card-foreground">
                            {entry.teacherName}
                          </td>
                          <td className="px-3 py-2.5 text-end tabular-nums text-muted-foreground">
                            {Number(entry.totalPayments).toLocaleString()}{" "}
                            <span className="text-xs">
                              {t("payments.currency")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-end font-medium tabular-nums text-card-foreground">
                            {Number(entry.calculatedSalary).toLocaleString()}{" "}
                            <span className="text-xs text-muted-foreground">
                              {t("payments.currency")}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-end">
                            <button
                              type="button"
                              onClick={() => handlePayEntry(entry)}
                              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              {t("salaries.pay")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t("salaries.noPayments")}
                </p>
              )}
            </div>
          )}
        </section>
      </PermissionGate>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-card-foreground">
          {t("salaries.recordsTitle")}
        </h2>
        <FilterBar>
          <select
            id="salary-month-filter"
            aria-label={t("salaries.month")}
            value={monthFilter}
            onChange={(e) =>
              updateFilters(() => setMonthFilter(e.target.value))
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="">{t("salaries.allMonths")}</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            id="salary-year-filter"
            type="number"
            placeholder={t("salaries.year")}
            aria-label={t("salaries.year")}
            min="2020"
            max="2100"
            value={yearFilter}
            onChange={(e) =>
              updateFilters(() => setYearFilter(e.target.value))
            }
            className={`${inputClassName} w-auto`}
          />
          <select
            id="salary-paid-filter"
            aria-label={t("salaries.status")}
            value={paidFilter}
            onChange={(e) =>
              updateFilters(() => setPaidFilter(e.target.value))
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="">{t("attendance.allStatuses")}</option>
            <option value="true">{t("salaries.paid")}</option>
            <option value="false">{t("salaries.unpaid")}</option>
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={data?.items}
          getRowKey={(salary) => salary.id}
          isLoading={isLoading}
          error={error ?? null}
          onRetry={() => void refetch()}
          emptyTitle={
            monthFilter || yearFilter || paidFilter
              ? t("salaries.emptyFiltered")
              : t("salaries.empty")
          }
          emptyDescription={t("salaries.emptyDescription")}
        />

        {data && data.meta.totalPages > 0 ? (
          <TablePagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPageChange={setPage}
          />
        ) : null}
      </section>

      {payEntry && (
        <PaySalaryDialog
          open={Boolean(payEntry)}
          entry={payEntry.entry}
          from={payEntry.from}
          to={payEntry.to}
          percentage={payEntry.percentage}
          onClose={() => setPayEntry(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deletingSalary)}
        onCancel={() => setDeletingSalary(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t("salaries.deleteTitle")}
        message={
          deletingSalary
            ? `${deletingSalary.teacherName ?? "Teacher"} — ${t(`months.${MONTHS[deletingSalary.salaryMonth - 1]?.toLowerCase() ?? "january"}` as "months.january")} ${deletingSalary.salaryYear}`
            : ""
        }
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteSalary.isPending}
      />
    </>
  );
}
