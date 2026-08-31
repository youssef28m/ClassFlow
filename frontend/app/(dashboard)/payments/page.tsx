"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { inputClassName } from "@/components/forms/field";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { StatusBadge, type BadgeTone } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import {
  useDeletePayment,
  usePaymentsQuery,
} from "@/features/payments/hooks";
import { useGroupsQuery } from "@/features/groups/hooks";
import { RecordPaymentDialog } from "@/features/payments/components/record-payment-dialog";
import {
  currentBillingPeriod,
  toDateInputValue,
} from "@/features/payments/billing-cycle";
import {
  PAYMENT_METHODS,
  type Payment,
  type PaymentMethod,
} from "@/features/payments/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const METHOD_TONES: Record<PaymentMethod, BadgeTone> = {
  CASH: "success",
  CARD: "info",
};

const PAGE_SIZE = 10;

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DEFAULT_FROM = (() => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toISODate(date);
})();

const DEFAULT_TO = toISODate(new Date());

export default function PaymentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [searchText, setSearchText] = useState("");
  const [methodFilter, setMethodFilter] = useState<"ALL" | PaymentMethod>("ALL");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [groupSearch, setGroupSearch] = useState("");
  const groupSelectingRef = useRef(false);
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(DEFAULT_TO);
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText);
  const deletePayment = useDeletePayment();

  const { data: groupsData } = useGroupsQuery({
    pageSize: 100,
    ...(groupSearch ? { search: groupSearch } : {}),
  });
  const handleGroupSearch = useCallback((q: string) => {
    if (!groupSelectingRef.current) setGroupSearch(q);
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      groupId: groupFilter ? Number(groupFilter) : undefined,
      paymentMethod: methodFilter === "ALL" ? undefined : methodFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    [page, search, groupFilter, methodFilter, fromDate, toDate],
  );

  const { data, isLoading, error, refetch } = usePaymentsQuery(filters);

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function handleConfirmDelete() {
    if (!deletingPayment) return;
    try {
      await deletePayment.mutateAsync(deletingPayment.id);
      toast.success(t("payments.deleted"));
      setDeletingPayment(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : t("common.somethingWentWrong"),
      );
      setDeletingPayment(null);
    }
  }

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "paymentDate",
      header: t("payments.columnDate"),
      className: "whitespace-nowrap",
      render: (payment) => formatDate(payment.paymentDate),
    },
    {
      key: "studentName",
      header: t("students.columnName"),
      render: (payment) => (
        <Link
          href={`/students/${payment.studentId}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {payment.studentName}
        </Link>
      ),
    },
    {
      key: "groupName",
      header: t("payments.columnGroup"),
    },
    {
      key: "amount",
      header: t("payments.amount"),
      render: (payment) => (
        <span className="font-medium tabular-nums">
          {Number(payment.amount).toLocaleString()}{" "}
          <span className="text-muted-foreground">{t("payments.currency")}</span>
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: t("payments.method"),
      render: (payment) => (
        <StatusBadge tone={METHOD_TONES[payment.paymentMethod]}>
          {tEnum(payment.paymentMethod)}
        </StatusBadge>
      ),
    },
    {
      key: "notes",
      header: t("payments.notes"),
      className: "hidden lg:table-cell max-w-48 truncate",
      render: (payment) => payment.notes ?? "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-end",
      render: (payment) =>
        can(user, "paymentsAndExpenses", "managePayments") ? (
          <button
            type="button"
            aria-label={t("common.delete")}
            onClick={() => setDeletingPayment(payment)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title={t("payments.title")}
        description={t("payments.description")}
        actions={
          can(user, "paymentsAndExpenses", "logPayment") ||
          can(user, "paymentsAndExpenses", "managePayments") ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              {t("payments.recordPayment")}
            </button>
          ) : null
        }
      />

      <PermissionGate resource="paymentsAndExpenses" action="read">
        <FilterBar>
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="payment-search"
              type="search"
              placeholder={t("payments.searchPlaceholder")}
              value={searchText}
              onChange={(event) => updateFilters(() => setSearchText(event.target.value))}
              className={`${inputClassName} ps-9`}
            />
          </div>
          <SearchableSelect
            value={groupFilter}
            onChange={(val) => {
              groupSelectingRef.current = true;
              updateFilters(() => {
                setGroupFilter(val);
                const group = (groupsData?.items ?? []).find((g) => g.id === Number(val));
                if (group) {
                  const today = new Date();
                  const refDate = new Date(
                    Date.UTC(today.getFullYear(), today.getMonth(), 1),
                  );
                  const period = currentBillingPeriod(
                    refDate,
                    group.paymentType,
                    group.billingAnchorDay,
                    today,
                  );
                  if (period) {
                    setFromDate(toDateInputValue(period.periodStart));
                    setToDate(
                      period.dueDate.getTime() < today.getTime()
                        ? toDateInputValue(period.dueDate)
                        : toDateInputValue(today),
                    );
                  }
                } else {
                  setFromDate(DEFAULT_FROM);
                  setToDate(DEFAULT_TO);
                }
              });
              requestAnimationFrame(() => { groupSelectingRef.current = false; });
            }}
            placeholder={t("groups.allGroups")}
            searchPlaceholder={t("groups.searchPlaceholder")}
            emptyText={t("groups.emptyFiltered")}
            loading={groupsData === undefined}
            className="w-auto min-w-65"
            options={(groupsData?.items ?? []).map((g) => ({
              value: g.id,
              label: g.name,
              hint: g.subject,
            }))}
            onSearch={handleGroupSearch}
          />
          <select
            id="payment-method-filter"
            aria-label={t("payments.method")}
            value={methodFilter}
            onChange={(event) =>
              updateFilters(() => {
                setMethodFilter(event.target.value as typeof methodFilter);
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">{t("attendance.allStatuses")}</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {tEnum(method)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("payments.from")}</span>
            <input
              id="payment-from"
              type="date"
              aria-label={t("payments.from")}
              value={fromDate}
              onChange={(event) => updateFilters(() => setFromDate(event.target.value))}
              className={`${inputClassName} w-auto`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("payments.to")}</span>
            <input
              id="payment-to"
              type="date"
              aria-label={t("payments.to")}
              value={toDate}
              onChange={(event) => updateFilters(() => setToDate(event.target.value))}
              className={`${inputClassName} w-auto`}
            />
          </label>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={data?.items}
          getRowKey={(payment) => payment.id}
          isLoading={isLoading}
          error={error ?? null}
          onRetry={() => void refetch()}
          emptyTitle={
            search ||
            groupFilter ||
            methodFilter !== "ALL" ||
            fromDate !== DEFAULT_FROM ||
            toDate !== DEFAULT_TO
              ? t("payments.emptyFiltered")
              : t("payments.empty")
          }
          emptyDescription={t("payments.emptyDescription")}
        />

        {data && data.meta.totalPages > 0 ? (
          <TablePagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onPageChange={setPage}
          />
        ) : null}
      </PermissionGate>

      <RecordPaymentDialog
        key={`record-${dialogOpen}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deletingPayment)}
        onCancel={() => setDeletingPayment(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t("payments.deleteTitle")}
        message={
          deletingPayment
            ? `${deletingPayment.studentName} — ${Number(deletingPayment.amount).toLocaleString()} ${t("payments.currency")}`
            : ""
        }
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deletePayment.isPending}
      />
    </>
  );
}
