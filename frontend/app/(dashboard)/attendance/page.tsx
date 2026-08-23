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
import { useSessionsQuery } from "@/features/attendance/hooks";
import type { ClassSession } from "@/features/attendance/types";
import { scheduleLabel } from "@/features/schedules/components/schedule-manager";
import { useSchedulesQuery } from "@/features/schedules/hooks";
import { useGroupsQuery } from "@/features/groups/hooks";
import { formatDate } from "@/lib/formatters";

const PAGE_SIZE = 10;

export default function AttendancePage() {
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
          scheduleLabel(schedule),
        ]),
      ),
    [schedules.data],
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
      header: "Date",
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
      header: "Group",
      render: (item) => (
        <Link
          href={`/groups/${item.groupId}`}
          className="text-card-foreground hover:text-primary"
        >
          {groupNames.get(item.groupId) ?? `Group #${item.groupId}`}
        </Link>
      ),
    },
    {
      key: "scheduleId",
      header: "Slot",
      className: "hidden md:table-cell",
      render: (item) => slotLabels.get(item.scheduleId) ?? `Slot #${item.scheduleId}`,
    },
    {
      key: "completed",
      header: "Status",
      render: (item) => (
        <StatusBadge tone={item.completed ? "success" : "warning"}>
          {item.completed ? "Completed" : "Upcoming"}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-44 text-right",
      render: (item) => (
        <Link
          href={`/attendance/${item.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-muted"
        >
          <ClipboardCheck className="size-4" aria-hidden />
          Take attendance
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Every booked session across your groups. Open one to record who attended."
      />

      <PermissionGate resource="groupsAndSessions" action="read">
        <FilterBar>
          <select
            id="attendance-group-filter"
            aria-label="Filter by group"
            value={groupFilter === "ALL" ? "ALL" : String(groupFilter)}
            onChange={(event) =>
              updateFilters(() => {
                const value = event.target.value;
                setGroupFilter(value === "ALL" ? "ALL" : Number(value));
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">All groups</option>
            {(groups.data?.items ?? []).map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
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
            <option value="ALL">All statuses</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="COMPLETED">Completed</option>
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
              ? "No sessions match your filters"
              : "No sessions booked yet"
          }
          emptyDescription="Open a group to add a weekly slot and book its first session."
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
