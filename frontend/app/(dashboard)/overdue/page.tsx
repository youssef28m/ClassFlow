"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { StatusBadge } from "@/components/tables/status-badge";
import { inputClassName } from "@/components/forms/field";
import { TablePagination } from "@/components/tables/table-pagination";
import { useOverdueQuery } from "@/features/dashboard/api";
import type { OverdueStudent } from "@/features/dashboard/types";
import { useI18n } from "@/lib/i18n/provider";

const PAGE_SIZE = 10;

export default function OverduePage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const { data, isLoading, error, refetch } = useOverdueQuery();

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (!searchText) return data.items;
    const lower = searchText.toLowerCase();
    return data.items.filter(
      (item) =>
        item.studentName.toLowerCase().includes(lower) ||
        item.groupName.toLowerCase().includes(lower),
    );
  }, [data, searchText]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const columns: DataTableColumn<OverdueStudent>[] = [
    {
      key: "studentName",
      header: t("students.columnName"),
      render: (entry) => (
        <Link
          href={`/students/${entry.studentId}`}
          className="font-medium text-card-foreground transition-colors hover:text-primary hover:underline"
        >
          {entry.studentName}
        </Link>
      ),
    },
    {
      key: "groupName",
      header: t("payments.columnGroup"),
    },
    {
      key: "fee",
      header: t("expenses.columnAmount"),
      render: (entry) => (
        <span className="font-medium tabular-nums">
          {Number(entry.fee).toLocaleString()}{" "}
          <span className="text-muted-foreground">{t("payments.currency")}</span>
        </span>
      ),
    },
    {
      key: "dueDate",
      header: t("overdue.dueDate"),
      className: "whitespace-nowrap hidden sm:table-cell",
    },
    {
      key: "daysOverdue",
      header: t("overdue.daysLate"),
      className: "whitespace-nowrap",
      render: (entry) => (
        <StatusBadge tone="danger">
          {t("studentDetail.overdueDays", { count: entry.daysOverdue })}
        </StatusBadge>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("overdue.title")}
        description={t("overdue.description")}
        actions={
          <Link
            href="/dashboard"
            className="flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("overdue.backToDashboard")}
          </Link>
        }
      />

      <FilterBar>
        <div className="relative w-full max-w-xs">
          <input
            id="overdue-search"
            type="search"
            placeholder={t("overdue.searchPlaceholder")}
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
            className={inputClassName}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={paginatedItems}
        getRowKey={(entry) => `${entry.studentId}-${entry.groupId}`}
        isLoading={isLoading}
        error={error ?? null}
        onRetry={() => void refetch()}
        emptyTitle={
          searchText ? t("overdue.emptyFiltered") : t("overdue.empty")
        }
        emptyDescription={t("overdue.emptyDescription")}
      />

      {filteredItems.length > PAGE_SIZE ? (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={filteredItems.length}
          onPageChange={setPage}
        />
      ) : null}
    </>
  );
}
