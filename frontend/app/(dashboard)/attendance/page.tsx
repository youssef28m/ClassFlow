"use client";

import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/tables/data-table";
import { StatusBadge } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import { inputClassName } from "@/components/forms/field";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { useSessionsQuery } from "@/features/attendance/hooks";
import type { ClassSession } from "@/features/attendance/types";
import { scheduleLabel } from "@/features/schedules/components/schedule-manager";
import { useSchedulesQuery } from "@/features/schedules/hooks";
import { useGroupsQuery } from "@/features/groups/hooks";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";

const PAGE_SIZE = 10;

export default function AttendancePage() {
  const { t, tEnum } = useI18n();
  const [groupFilter, setGroupFilter] = useState<"ALL" | number>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED">("ALL");
  const [page, setPage] = useState(1);

  const groups = useGroupsQuery({ pageSize: 100 });
  const schedules = useSchedulesQuery({ groupId: -1, pageSize: 100 });

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      groupId: groupFilter === "ALL" ? undefined : groupFilter,
      completed: statusFilter === "ALL" ? undefined : statusFilter === "COMPLETED",
    }),
    [page, groupFilter, statusFilter],
  );

  const sessions = useSessionsQuery(filters, true);

  const groupNames = useMemo(
    () => new Map((groups.data?.items ?? []).map((group) => [group.id, group.name])),
    [groups.data],
  );

  const slotLabels = useMemo(
    () =>
      new Map(
        (schedules.data?.items ?? []).map((schedule) => [
          schedule.id,
          scheduleLabel(schedule, tEnum),
        ]),
      ),
    [schedules.data, tEnum],
  );

  const items = useMemo(
    () =>
      [...(sessions.data?.items ?? [])].sort((a, b) =>
        b.sessionDate.localeCompare(a.sessionDate),
      ),
    [sessions.data],
  );

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  const columns: DataTableColumn<ClassSession>[] = [
    {
      key: "sessionDate",
      header: t("common.date"),
      render: (item) => (
        <Link
          href={`/attendance/${item.id}`}
          className="whitespace-nowrap font-medium text-primary hover:underline"
        >
          {formatDate(item.sessionDate)}
        </Link>
      ),
    },
    {
      key: "groupId",
      header: t("nav.groups"),
      render: (item) => (
        <Link
          href={`/groups/${item.groupId}`}
          className="text-card-foreground hover:text-primary"
        >
          {groupNames.get(item.groupId) ?? t("groups.fallbackId", { id: item.groupId })}
        </Link>
      ),
    },
    {
      key: "scheduleId",
      header: t("schedules.slotColumn"),
      className: "hidden md:table-cell",
      render: (item) => slotLabels.get(item.scheduleId) ??
        t("schedules.slotFallbackId", { id: item.scheduleId }),
    },
    {
      key: "completed",
      header: t("common.status"),
      render: (item) => (
        <StatusBadge tone={item.completed ? "success" : "warning"}>
          {item.completed ? t("enum.COMPLETED") : t("enum.UPCOMING")}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-44 text-end",
      render: (item) => (
        <Link
          href={`/attendance/${item.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
        >
          <ClipboardCheck className="size-4" aria-hidden />
          {t("attendance.takeAttendance")}
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t("nav.attendance")}
        description={t("attendance.description")}
      />

      <PermissionGate resource="groupsAndSessions" action="read">
        <FilterBar>
          <SearchableSelect
            value={groupFilter === "ALL" ? "" : String(groupFilter)}
            onChange={(val) =>
              updateFilters(() => {
                setGroupFilter(val === "" ? "ALL" : Number(val));
              })
            }
            placeholder={t("schedules.allGroups")}
            searchPlaceholder={t("groups.searchPlaceholder")}
            emptyText={t("groups.emptyFiltered")}
            loading={groups.isLoading}
            className="w-auto min-w-65"
            options={(groups.data?.items ?? []).map((g) => ({
              value: g.id,
              label: g.name,
              hint: g.subject,
            }))}
          />
          <select
            id="attendance-status-filter"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) =>
              updateFilters(() => {
                setStatusFilter(event.target.value as typeof statusFilter);
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">{t("attendance.allStatuses")}</option>
            <option value="UPCOMING">{t("enum.UPCOMING")}</option>
            <option value="COMPLETED">{t("enum.COMPLETED")}</option>
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(item) => item.id}
          isLoading={sessions.isLoading}
          error={sessions.error ?? null}
          onRetry={() => void sessions.refetch()}
          emptyTitle={
            groupFilter !== "ALL" || statusFilter !== "ALL"
              ? t("sessions.emptyFiltered")
              : t("sessions.empty")
          }
          emptyDescription={t("sessions.emptyDescription")}
        />

        {sessions.data && sessions.data.meta.totalPages > 0 ? (
          <TablePagination
            page={sessions.data.meta.page}
            totalPages={sessions.data.meta.totalPages}
            total={sessions.data.meta.total}
            onPageChange={setPage}
          />
        ) : null}
      </PermissionGate>
    </>
  );
}
