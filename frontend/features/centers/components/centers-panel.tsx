"use client";

import { ArrowRight, Plus, Power, Search, SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useToast } from "@/components/feedback/toast";
import { inputClassName } from "@/components/forms/field";
import type { DataTableColumn } from "@/components/tables/data-table";
import { DataTable } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { StatusBadge } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import { CenterFormDialog } from "@/features/centers/components/center-form-dialog";
import {
  useCentersQuery,
  useDeactivateCenter,
  useUpdateCenter,
} from "@/features/centers/hooks";
import type { Center } from "@/features/centers/types";
import { ApiError } from "@/lib/api-client";
import { useCenterScope } from "@/lib/center-scope";
import { useI18n } from "@/lib/i18n/provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

const ACTIVE_FILTERS: ActiveFilter[] = ["ALL", "ACTIVE", "INACTIVE"];

const PAGE_SIZE = 10;

export function CentersPanel() {
  const toast = useToast();
  const router = useRouter();
  const { setCenterId } = useCenterScope();
  const { t, tEnum } = useI18n();
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [deactivatingCenter, setDeactivatingCenter] = useState<Center | null>(
    null,
  );

  const deactivateCenter = useDeactivateCenter();
  const reactivateCenter = useUpdateCenter();

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      active:
        activeFilter === "ALL"
          ? undefined
          : activeFilter === "ACTIVE",
    }),
    [page, search, activeFilter],
  );

  const { data, isLoading, error, refetch } = useCentersQuery(filters);

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function handleConfirmDeactivate() {
    if (!deactivatingCenter) return;
    try {
      await deactivateCenter.mutateAsync(deactivatingCenter.id);
      toast.success(t("centers.deactivated"));
      setDeactivatingCenter(null);
    } catch (deactivateError) {
      toast.error(
        deactivateError instanceof ApiError
          ? deactivateError.message
          : t("common.somethingWentWrong"),
      );
      setDeactivatingCenter(null);
    }
  }

  async function handleReactivate(center: Center) {
    try {
      await reactivateCenter.mutateAsync({ id: center.id, payload: { active: true } });
      toast.success(t("centers.reactivated"));
    } catch (reactivateError) {
      toast.error(
        reactivateError instanceof ApiError
          ? reactivateError.message
          : t("common.somethingWentWrong"),
      );
    }
  }

  function enterCenter(center: Center) {
    setCenterId(center.id);
    router.push("/dashboard");
  }

  const columns: DataTableColumn<Center>[] = [
    {
      key: "name",
      header: t("centers.columnName"),
      render: (center) => (
        <button
          type="button"
          disabled={!center.active}
          onClick={() => enterCenter(center)}
          title={t("centers.enter")}
          className="group inline-flex max-w-full items-center gap-2 font-medium text-card-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{center.name}</span>
          {center.active ? (
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary rtl:-scale-x-100"
              aria-hidden
            />
          ) : null}
        </button>
      ),
    },
    {
      key: "phone",
      header: t("centers.columnPhone"),
      className: "hidden sm:table-cell",
    },
    {
      key: "address",
      header: t("centers.columnAddress"),
      className: "hidden lg:table-cell",
      render: (center) => <span className="text-muted-foreground">{center.address}</span>,
    },
    {
      key: "status",
      header: t("common.status"),
      render: (center) => (
        <StatusBadge tone={center.active ? "success" : "neutral"}>
          {tEnum(center.active ? "ACTIVE" : "INACTIVE")}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32 text-end",
      render: (center) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label={t("common.edit")}
            onClick={() => {
              setEditingCenter(center);
              setFormOpen(true);
            }}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
          >
            <SquarePen className="size-4" aria-hidden />
          </button>
          {center.active ? (
            <button
              type="button"
              aria-label={t("common.deactivate")}
              onClick={() => setDeactivatingCenter(center)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Power className="size-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleReactivate(center)}
              disabled={reactivateCenter.isPending}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 disabled:opacity-50 dark:hover:text-emerald-400"
              title={t("common.activate")}
            >
              <Power className="size-4" aria-hidden />
            </button>
          )}
        </div>
      ),
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
            id="center-search"
            type="search"
            placeholder={t("centers.searchPlaceholder")}
            value={searchText}
            onChange={(event) =>
              updateFilters(() => setSearchText(event.target.value))
            }
            className={`${inputClassName} ps-9`}
          />
        </div>
        <select
          id="center-status-filter"
          aria-label={t("common.status")}
          value={activeFilter}
          onChange={(event) =>
            updateFilters(() => {
              setActiveFilter(event.target.value as ActiveFilter);
            })
          }
          className={`${inputClassName} w-auto`}
        >
          {ACTIVE_FILTERS.map((option) => (
            <option key={option} value={option}>
              {option === "ALL"
                ? t("common.all")
                : option === "ACTIVE"
                  ? tEnum("ACTIVE")
                  : tEnum("INACTIVE")}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setEditingCenter(null);
            setFormOpen(true);
          }}
          className="ms-auto flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" aria-hidden />
          {t("centers.add")}
        </button>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowKey={(center) => center.id}
        isLoading={isLoading}
        error={error ?? null}
        onRetry={() => void refetch()}
        emptyTitle={
          search || activeFilter !== "ALL"
            ? t("centers.emptyFiltered")
            : t("centers.empty")
        }
        emptyDescription={t("centers.emptyDescription")}
      />

      {data && data.meta.totalPages > 0 ? (
        <TablePagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onPageChange={setPage}
        />
      ) : null}

      <CenterFormDialog
        key={`center-form-${formOpen}-${editingCenter?.id ?? "new"}`}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCenter(null);
        }}
        center={editingCenter}
      />

      <ConfirmDialog
        open={Boolean(deactivatingCenter)}
        onCancel={() => setDeactivatingCenter(null)}
        onConfirm={() => void handleConfirmDeactivate()}
        title={
          deactivatingCenter
            ? t("centers.deactivateTitle", { name: deactivatingCenter.name })
            : t("centers.deactivateTitle", { name: "" })
        }
        message={t("centers.deactivateMessage")}
        confirmLabel={t("common.deactivate")}
        tone="danger"
        isLoading={deactivateCenter.isPending}
      />
    </>
  );
}