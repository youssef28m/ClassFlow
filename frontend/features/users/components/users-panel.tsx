"use client";

import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useToast } from "@/components/feedback/toast";
import { inputClassName } from "@/components/forms/field";
import type { DataTableColumn } from "@/components/tables/data-table";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { TablePagination } from "@/components/tables/table-pagination";
import { ROLE_TONE_CLASSES } from "@/components/navigation/nav-config";
import { CenterSelect } from "@/features/centers/components/center-select";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { useDeleteUser, useUsersQuery } from "@/features/users/hooks";
import type { AdminUser } from "@/features/users/types";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { USER_ROLES } from "@/types/auth";

const ROLE_FILTERS = ["ALL", ...USER_ROLES] as const;

const PAGE_SIZE = 10;

export function UsersPanel() {
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [centerFilter, setCenterFilter] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const deleteUser = useDeleteUser();

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      role: roleFilter === "ALL" ? undefined : (roleFilter as AdminUser["role"]),
      centerId: centerFilter ? Number(centerFilter) : undefined,
    }),
    [page, search, roleFilter, centerFilter],
  );

  const { data, isLoading, error, refetch } = useUsersQuery(filters);

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function handleConfirmDelete() {
    if (!deletingUser || deletingUser.centerId == null) return;
    try {
      await deleteUser.mutateAsync({
        id: deletingUser.id,
        centerId: deletingUser.centerId,
      });
      toast.success(t("users.deleted"));
      setDeletingUser(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : t("common.somethingWentWrong"),
      );
      setDeletingUser(null);
    }
  }

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "username",
      header: t("users.columnUsername"),
      render: (user) => (
        <span className="font-medium text-card-foreground">{user.username}</span>
      ),
    },
    {
      key: "role",
      header: t("users.columnRole"),
      render: (user) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_TONE_CLASSES[user.role] ?? ""}`}
        >
          {tEnum(user.role)}
        </span>
      ),
    },
    {
      key: "center",
      header: t("users.columnCenter"),
      className: "hidden sm:table-cell",
      render: (user) =>
        user.centerId != null ? (
          <span className="text-muted-foreground">{user.centerName ?? `#${user.centerId}`}</span>
        ) : (
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            {t("users.global")}
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-end",
      render: (user) =>
        user.centerId != null ? (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              aria-label={t("common.edit")}
              onClick={() => {
                setEditingUser(user);
                setFormOpen(true);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            >
              <SquarePen className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("common.delete")}
              onClick={() => setDeletingUser(user)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <FilterBar>
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="user-search"
            type="search"
            placeholder={t("users.searchPlaceholder")}
            value={searchText}
            onChange={(event) =>
              updateFilters(() => setSearchText(event.target.value))
            }
            className={`${inputClassName} ps-9`}
          />
        </div>
        <select
          id="user-role-filter"
          aria-label={t("users.columnRole")}
          value={roleFilter}
          onChange={(event) =>
            updateFilters(() => setRoleFilter(event.target.value))
          }
          className={`${inputClassName} w-auto`}
        >
          {ROLE_FILTERS.map((role) => (
            <option key={role} value={role}>
              {role === "ALL" ? t("common.all") : tEnum(role)}
            </option>
          ))}
        </select>
        <CenterSelect
          value={centerFilter}
          onChange={(nextValue) =>
            updateFilters(() => setCenterFilter(nextValue))
          }
          placeholder={t("users.filterByCenter")}
          className="w-52"
        />
        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
          className="ms-auto flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden />
          {t("users.add")}
        </button>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(user) => user.id}
        isLoading={isLoading}
        error={error ?? null}
        onRetry={() => void refetch()}
        emptyTitle={
          search || roleFilter !== "ALL"
            ? t("users.emptyFiltered")
            : t("users.empty")
        }
        emptyDescription={t("users.emptyDescription")}
      />

      {data && data.meta.totalPages > 0 ? (
        <TablePagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onPageChange={setPage}
        />
      ) : null}

      <UserFormDialog
        key={`user-form-${formOpen}-${editingUser?.id ?? "new"}`}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />

      <ConfirmDialog
        open={Boolean(deletingUser)}
        onCancel={() => setDeletingUser(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={
          deletingUser
            ? t("users.confirmDeleteTitle", { name: deletingUser.username })
            : t("users.confirmDeleteTitle", { name: "" })
        }
        message={t("users.confirmDeleteMessage")}
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteUser.isPending}
      />
    </>
  );
}