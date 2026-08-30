"use client";

import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  FileBarChart2,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { inputClassName } from "@/components/forms/field";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { StatusBadge } from "@/components/tables/status-badge";
import { useGroupPaymentReportQuery, useGroupQuery } from "@/features/groups/hooks";
import type { Group, GroupPaymentReportStudent } from "@/features/groups/types";
import {
  currentBillingPeriod,
  toDateInputValue,
} from "@/features/payments/billing-cycle";
import { formatDate } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n/provider";

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentPeriodRange(group: Group): { from: string; to: string } | null {
  const today = new Date();
  const refDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
  const period = currentBillingPeriod(
    refDate,
    group.paymentType,
    group.billingAnchorDay,
    today,
  );
  if (!period) return null;
  const to =
    period.dueDate.getTime() < today.getTime()
      ? toDateInputValue(period.dueDate)
      : toDateInputValue(today);
  return { from: toDateInputValue(period.periodStart), to };
}

interface GroupReportPanelProps {
  groupId: number;
  group: Group;
}

function GroupReportPanel({ groupId, group }: GroupReportPanelProps) {
  const { t } = useI18n();
  const defaultRange = currentPeriodRange(group) ?? {
    from: toISODate(new Date()),
    to: toISODate(new Date()),
  };
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [appliedFrom, setAppliedFrom] = useState(defaultRange.from);
  const [appliedTo, setAppliedTo] = useState(defaultRange.to);
  const [rangeError, setRangeError] = useState(false);

  const query = useGroupPaymentReportQuery(groupId, {
    from: appliedFrom || undefined,
    to: appliedTo || undefined,
  });

  const report = query.data;

  function applyRange() {
    if (from && to && from > to) {
      setRangeError(true);
      return;
    }
    setRangeError(false);
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const columns: DataTableColumn<GroupPaymentReportStudent>[] = [
    {
      key: "fullName",
      header: t("groupReport.student"),
      render: (entry) => (
        <Link
          href={`/students/${entry.studentId}`}
          className="font-medium text-card-foreground transition-colors hover:text-primary hover:underline"
        >
          {entry.fullName}
        </Link>
      ),
    },
    {
      key: "grade",
      header: t("groupReport.grade"),
      render: (entry) => <StatusBadge tone="neutral">{entry.grade}</StatusBadge>,
    },
    {
      key: "phone",
      header: t("groupReport.phone"),
      className: "whitespace-nowrap hidden sm:table-cell",
      render: (entry) => entry.phone ?? "—",
    },
    {
      key: "paymentCount",
      header: t("groupReport.paymentCount"),
      className: "whitespace-nowrap",
      render: (entry) =>
        entry.paymentCount === 0 ? "—" : entry.paymentCount.toLocaleString(),
    },
    {
      key: "totalPaid",
      header: t("groupReport.totalPaid"),
      className: "whitespace-nowrap",
      render: (entry) => (
        <span className={entry.paid ? "font-medium tabular-nums" : "text-muted-foreground"}>
          {Number(entry.totalPaid).toLocaleString()}{" "}
          <span className="text-muted-foreground">{t("payments.currency")}</span>
        </span>
      ),
    },
    {
      key: "lastPaymentDate",
      header: t("groupReport.lastPayment"),
      className: "whitespace-nowrap hidden lg:table-cell",
      render: (entry) => (entry.lastPaymentDate ? formatDate(entry.lastPaymentDate) : "—"),
    },
    {
      key: "status",
      header: t("groupReport.status"),
      className: "whitespace-nowrap",
      render: (entry) =>
        entry.paid ? (
          <StatusBadge tone="success">{t("groupReport.paid")}</StatusBadge>
        ) : (
          <StatusBadge tone="danger">{t("groupReport.notPaid")}</StatusBadge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("groupReport.title")}
        description={
          report
            ? t("groupReport.generatedFor", {
                group: report.group.name,
                from: report.from ? formatDate(report.from) : "—",
                to: report.to ? formatDate(report.to) : "—",
              })
            : t("groupReport.meta")
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("groupReport.from")}
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className={inputClassName}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {t("groupReport.to")}
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className={inputClassName}
            />
          </label>
          <button
            type="button"
            onClick={applyRange}
            disabled={query.isFetching}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <FileBarChart2 className="size-4" aria-hidden />
            {t("groupReport.generate")}
          </button>
        </div>
        {rangeError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {t("groupReport.invalidRange")}
          </p>
        ) : null}
      </FilterBar>

      {report ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("groupReport.totalStudents")}
              </h2>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-card-foreground">
              {report.totalStudents.toLocaleString()}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("groupReport.paidStudents")}
              </h2>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {report.paidStudents.toLocaleString()}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <CircleX className="size-4 text-red-600 dark:text-red-400" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("groupReport.notPaidStudents")}
              </h2>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {report.notPaidStudents.toLocaleString()}
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("groupReport.totalCollected")}
              </h2>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-card-foreground">
              {Number(report.totalCollected).toLocaleString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {t("payments.currency")}
              </span>
            </p>
          </section>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={report?.students ?? query.data?.students}
        getRowKey={(entry) => entry.studentId}
        isLoading={query.isLoading}
        error={query.error ?? null}
        onRetry={() => void query.refetch()}
        emptyTitle={query.data ? t("groupReport.noStudents") : t("groupReport.isEmpty")}
        emptyDescription={query.data ? undefined : t("groupReport.meta")}
      />
    </>
  );
}

export default function GroupPaymentsReportPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id ? Number(params.id) : NaN;
  const validGroupId = Number.isInteger(groupId) && groupId > 0;

  const { t } = useI18n();
  const groupQuery = useGroupQuery(validGroupId ? groupId : undefined);
  const group = groupQuery.data;

  return (
    <>
      <Link
        href={`/groups/${groupId}`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-card-foreground"
      >
        <ArrowLeft className="size-4 rtl-flip" aria-hidden />
        {t("groupReport.backToGroup")}
      </Link>

      {group ? <GroupReportPanel key={group.id} groupId={groupId} group={group} /> : null}
    </>
  );
}
