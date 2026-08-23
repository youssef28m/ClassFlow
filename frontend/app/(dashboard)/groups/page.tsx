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
import { humanizeEnum } from "@/lib/formatters";
import { can } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 10;

export default function GroupsPage() {
  const { user } = useAuth();
  const toast = useToast();
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
      toast.success("Group deleted");
      setDeletingGroup(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : "Failed to delete group",
      );
      setDeletingGroup(null);
    }
  }

  const columns: DataTableColumn<Group>[] = [
    {
      key: "name",
      header: "Name",
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
      header: "Subject",
      className: "hidden sm:table-cell",
    },
    {
      key: "teacherId",
      header: "Teacher",
      render: (group) =>
        teacherNames.get(group.teacherId) ?? `Teacher #${group.teacherId}`,
    },
    {
      key: "room",
      header: "Room",
      className: "hidden md:table-cell",
    },
    {
      key: "fee",
      header: "Fee",
      render: (group) => (
        <span className="whitespace-nowrap tabular-nums">{group.fee}</span>
      ),
    },
    {
      key: "paymentType",
      header: "Payment type",
      className: "hidden lg:table-cell",
      render: (group) => (
        <StatusBadge tone="neutral">{humanizeEnum(group.paymentType)}</StatusBadge>
      ),
    },
    {
      key: "maxStudents",
      header: "Capacity",
      className: "hidden xl:table-cell",
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (group) => (
        <div className="flex justify-end gap-1">
          {can(user, "groupsAndSessions", "manageGroups") ? (
            <button
              type="button"
              aria-label={`Edit ${group.name}`}
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
              aria-label={`Delete ${group.name}`}
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
        title="Groups"
        description="Teaching groups, fees, and capacity."
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
              Add group
            </button>
          </PermissionGate>
        }
      />

      <PermissionGate resource="groupsAndSessions" action="read">
        <FilterBar>
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="group-search"
              type="search"
              placeholder="Search name, subject, room…"
              value={searchText}
              onChange={(event) =>
                updateFilters(() => setSearchText(event.target.value))
              }
              className={`${inputClassName} pl-9`}
            />
          </div>
          <select
            id="group-payment-type-filter"
            aria-label="Filter by payment type"
            value={paymentTypeFilter}
            onChange={(event) =>
              updateFilters(() => {
                setPaymentTypeFilter(event.target.value as typeof paymentTypeFilter);
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">All payment types</option>
            {PAYMENT_TYPES.map((paymentType) => (
              <option key={paymentType} value={paymentType}>
                {humanizeEnum(paymentType)}
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
              ? "No groups match your filters"
              : "No groups yet"
          }
          emptyDescription="Create a group to start enrolling students and scheduling sessions."
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
        title={`Delete ${deletingGroup?.name ?? "group"}?`}
        message="Groups with enrolled students cannot be deleted. Remove their enrollments first."
        confirmLabel="Delete group"
        tone="danger"
        isLoading={deleteGroup.isPending}
      />
    </>
  );
}
