"use client";

import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { StatusBadge } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import { inputClassName } from "@/components/forms/field";
import { GroupFormDialog } from "@/features/groups/components/group-form-dialog";
import { useDeleteGroup, useGroupsQuery } from "@/features/groups/hooks";
import { PAYMENT_TYPES, type Group, type PaymentType } from "@/features/groups/types";
import { useTeachersQuery } from "@/features/teachers/hooks";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { can } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 10;

export default function GroupsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [searchText, setSearchText] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<"ALL" | PaymentType>("ALL");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText);
  const deleteGroup = useDeleteGroup();
  const teachers = useTeachersQuery({ pageSize: 100 });

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      paymentType: paymentTypeFilter === "ALL" ? undefined : paymentTypeFilter,
    }),
    [page, search, paymentTypeFilter],
  );

  const { data, isLoading, error, refetch } = useGroupsQuery(filters);

  const teacherNames = useMemo(() => {
    const map = new Map<number, string>();
    for (const teacher of teachers.data?.items ?? []) {
      map.set(teacher.id, teacher.fullName);
    }
    return map;
  }, [teachers.data]);

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function handleConfirmDelete() {
    if (!deletingGroup) return;
    try {
      await deleteGroup.mutateAsync(deletingGroup.id);
      toast.success(t("groups.deleted"));
      setDeletingGroup(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : t("common.somethingWentWrong"),
      );
      setDeletingGroup(null);
    }
  }

  const columns: DataTableColumn<Group>[] = [
    {
      key: "name",
      header: t("groups.columnName"),
      render: (group) => (
        <Link
          href={`/groups/${group.id}`}
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          {group.name}
        </Link>
      ),
    },
    {
      key: "subject",
      header: t("groups.columnSubject"),
      className: "hidden sm:table-cell",
    },
    {
      key: "teacherId",
      header: t("common.teacher"),
      render: (group) =>
        teacherNames.get(group.teacherId) ??
        t("teachers.fallbackId", { id: group.teacherId }),
    },
    {
      key: "room",
      header: t("groups.columnRoom"),
      className: "hidden md:table-cell",
    },
    {
      key: "fee",
      header: t("groups.columnFee"),
      render: (group) => (
        <span className="whitespace-nowrap tabular-nums">{group.fee}</span>
      ),
    },
    {
      key: "paymentType",
      header: t("groups.columnPaymentType"),
      className: "hidden lg:table-cell",
      render: (group) => (
        <StatusBadge tone="neutral">{tEnum(group.paymentType)}</StatusBadge>
      ),
    },
    {
      key: "maxStudents",
      header: t("groups.columnCapacity"),
      className: "hidden xl:table-cell",
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-end",
      render: (group) => (
        <div className="flex justify-end gap-1">
          {can(user, "groupsAndSessions", "manageGroups") ? (
            <button
              type="button"
              aria-label={t("common.edit")}
              onClick={() => {
                setEditingGroup(group);
                setFormOpen(true);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            >
              <SquarePen className="size-4" aria-hidden />
            </button>
          ) : null}
          {can(user, "groupsAndSessions", "manageGroups") ? (
            <button
              type="button"
              aria-label={t("common.delete")}
              onClick={() => setDeletingGroup(group)}
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
        title={t("nav.groups")}
        description={t("groups.description")}
        actions={
          <PermissionGate resource="groupsAndSessions" action="manageGroups">
            <button
              type="button"
              onClick={() => {
                setEditingGroup(null);
                setFormOpen(true);
              }}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              {t("groups.add")}
            </button>
          </PermissionGate>
        }
      />

      <PermissionGate resource="groupsAndSessions" action="read">
        <FilterBar>
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="group-search"
              type="search"
              placeholder={t("groups.searchPlaceholder")}
              value={searchText}
              onChange={(event) =>
                updateFilters(() => setSearchText(event.target.value))
              }
              className={`${inputClassName} ps-9`}
            />
          </div>
          <select
            id="group-payment-type-filter"
            aria-label={t("groups.filterPaymentType")}
            value={paymentTypeFilter}
            onChange={(event) =>
              updateFilters(() => {
                setPaymentTypeFilter(event.target.value as typeof paymentTypeFilter);
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">{t("groups.allPaymentTypes")}</option>
            {PAYMENT_TYPES.map((paymentType) => (
              <option key={paymentType} value={paymentType}>
                {tEnum(paymentType)}
              </option>
            ))}
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={data?.items}
          getRowKey={(group) => group.id}
          isLoading={isLoading}
          error={error ?? null}
          onRetry={() => void refetch()}
          emptyTitle={
            search || paymentTypeFilter !== "ALL"
              ? t("groups.emptyFiltered")
              : t("groups.empty")
          }
          emptyDescription={t("groups.emptyDescription")}
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

      <GroupFormDialog
        key={`${formOpen}-${editingGroup?.id ?? "new"}`}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingGroup(null);
        }}
        group={editingGroup}
      />

      <ConfirmDialog
        open={Boolean(deletingGroup)}
        onCancel={() => setDeletingGroup(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={deletingGroup ? t("groups.deleteTitle", { name: deletingGroup.name }) : t("groups.deleteTitle", { name: "" })}
        message={t("groups.deleteMessage")}
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteGroup.isPending}
      />
    </>
  );
}
