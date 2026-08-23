"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { inputClassName } from "@/components/forms/field";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { StatusBadge, type BadgeTone } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import {
  useDeletePayment,
  usePaymentsQuery,
} from "@/features/payments/hooks";
import { RecordPaymentDialog } from "@/features/payments/components/record-payment-dialog";
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

const METHOD_TONES: Record<PaymentMethod, BadgeTone> = {
  CASH: "success",
  CARD: "info",
};

const PAGE_SIZE = 10;

export default function PaymentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [methodFilter, setMethodFilter] = useState<"ALL" | PaymentMethod>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const deletePayment = useDeletePayment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      paymentMethod: methodFilter === "ALL" ? undefined : methodFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    [page, methodFilter, fromDate, toDate],
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
      render: (payment) => <span className="font-medium">{payment.studentName}</span>,
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
            methodFilter !== "ALL" || fromDate || toDate
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
