"use client";

import { Plus, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { inputClassName } from "@/components/forms/field";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { TablePagination } from "@/components/tables/table-pagination";
import { ExpenseFormDialog } from "@/features/expenses/components/expense-form-dialog";
import {
  useDeleteExpense,
  useExpensesQuery,
} from "@/features/expenses/hooks";
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
} from "@/features/expenses/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";

const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | ExpenseCategory>(
    "ALL",
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const deleteExpense = useDeleteExpense();

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      category: categoryFilter === "ALL" ? undefined : categoryFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    [page, categoryFilter, fromDate, toDate],
  );

  const { data, isLoading, error, refetch } = useExpensesQuery(filters);

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function handleConfirmDelete() {
    if (!deletingExpense) return;
    try {
      await deleteExpense.mutateAsync(deletingExpense.id);
      toast.success(t("expenses.deleted"));
      setDeletingExpense(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : t("common.somethingWentWrong"),
      );
      setDeletingExpense(null);
    }
  }

  const columns: DataTableColumn<Expense>[] = [
    {
      key: "expenseDate",
      header: t("expenses.columnDate"),
      className: "whitespace-nowrap",
      render: (expense) => formatDate(expense.expenseDate),
    },
    {
      key: "category",
      header: t("expenses.columnCategory"),
      render: (expense) => (
        <span className="font-medium">{tEnum(expense.category)}</span>
      ),
    },
    {
      key: "amount",
      header: t("expenses.columnAmount"),
      render: (expense) => (
        <span className="font-medium tabular-nums">
          {Number(expense.amount).toLocaleString()}{" "}
          <span className="text-muted-foreground">{t("expenses.currency")}</span>
        </span>
      ),
    },
    {
      key: "description",
      header: t("expenses.columnDescription"),
      className: "hidden md:table-cell max-w-48 truncate",
      render: (expense) => expense.description ?? "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-end",
      render: (expense) => (
        <div className="flex justify-end gap-1">
          {can(user, "paymentsAndExpenses", "manageExpenses") ? (
            <button
              type="button"
              aria-label={t("common.edit")}
              onClick={() => {
                setEditingExpense(expense);
                setFormOpen(true);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            >
              <SquarePen className="size-4" aria-hidden />
            </button>
          ) : null}
          {can(user, "paymentsAndExpenses", "manageExpenses") ? (
            <button
              type="button"
              aria-label={t("common.delete")}
              onClick={() => setDeletingExpense(expense)}
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
        title={t("expenses.title")}
        description={t("expenses.description")}
        actions={
          can(user, "paymentsAndExpenses", "createExpense") ||
          can(user, "paymentsAndExpenses", "manageExpenses") ? (
            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setFormOpen(true);
              }}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              {t("expenses.add")}
            </button>
          ) : null
        }
      />

      <PermissionGate resource="paymentsAndExpenses" action="read">
        <FilterBar>
          <select
            id="expense-category-filter"
            aria-label={t("expenses.fieldCategory")}
            value={categoryFilter}
            onChange={(event) =>
              updateFilters(() => {
                setCategoryFilter(event.target.value as typeof categoryFilter);
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">{t("attendance.allStatuses")}</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {tEnum(cat)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("expenses.from")}</span>
            <input
              id="expense-from"
              type="date"
              aria-label={t("expenses.from")}
              value={fromDate}
              onChange={(event) =>
                updateFilters(() => setFromDate(event.target.value))
              }
              className={`${inputClassName} w-auto`}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("expenses.to")}</span>
            <input
              id="expense-to"
              type="date"
              aria-label={t("expenses.to")}
              value={toDate}
              onChange={(event) =>
                updateFilters(() => setToDate(event.target.value))
              }
              className={`${inputClassName} w-auto`}
            />
          </label>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={data?.items}
          getRowKey={(expense) => expense.id}
          isLoading={isLoading}
          error={error ?? null}
          onRetry={() => void refetch()}
          emptyTitle={
            categoryFilter !== "ALL" || fromDate || toDate
              ? t("expenses.emptyFiltered")
              : t("expenses.empty")
          }
          emptyDescription={t("expenses.emptyDescription")}
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

      <ExpenseFormDialog
        key={`${formOpen}-${editingExpense?.id ?? "new"}`}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
      />

      <ConfirmDialog
        open={Boolean(deletingExpense)}
        onCancel={() => setDeletingExpense(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t("expenses.deleteTitle")}
        message={
          deletingExpense
            ? `${tEnum(deletingExpense.category)} — ${Number(deletingExpense.amount).toLocaleString()} ${t("expenses.currency")}`
            : ""
        }
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteExpense.isPending}
      />
    </>
  );
}
