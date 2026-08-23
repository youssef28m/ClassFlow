"use client";

import { Plus, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { inputClassName } from "@/components/forms/field";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { TablePagination } from "@/components/tables/table-pagination";
import { useGroupsQuery } from "@/features/groups/hooks";
import { ScheduleFormDialog } from "@/features/schedules/components/schedule-form-dialog";
import { useDeleteSchedule, useSchedulesQuery } from "@/features/schedules/hooks";
import { DAYS_OF_WEEK, type DayOfWeek, type Schedule } from "@/features/schedules/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { humanizeEnum, formatSlotTime } from "@/lib/formatters";
import { can } from "@/lib/permissions";

const PAGE_SIZE = 10;

export default function SchedulesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [groupId, setGroupId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<"ALL" | DayOfWeek>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
  const groups = useGroupsQuery({ pageSize: 100 });
  const filters = useMemo(() => ({ page, pageSize: PAGE_SIZE, groupId: groupId ? Number(groupId) : undefined, dayOfWeek: dayOfWeek === "ALL" ? undefined : dayOfWeek }), [dayOfWeek, groupId, page]);
  const { data, isLoading, error, refetch } = useSchedulesQuery(filters);
  const canManage = can(user, "groupsAndSessions", "manageSchedules");
  const groupNames = useMemo(() => new Map((groups.data?.items ?? []).map((group) => [group.id, group.name])), [groups.data]);

  function updateFilters(update: () => void) { setPage(1); update(); }
  async function confirmDelete() {
    if (!deletingSchedule) return;
    try { await deleteSchedule.mutateAsync(deletingSchedule.id); toast.success("Schedule deleted"); }
    catch (deleteError) { toast.error(deleteError instanceof ApiError ? deleteError.message : "Failed to delete schedule"); }
    finally { setDeletingSchedule(null); }
  }
  const deleteSchedule = useDeleteSchedule();
  const columns: DataTableColumn<Schedule>[] = [
    { key: "groupId", header: "Group", render: (schedule) => <span className="font-medium">{groupNames.get(schedule.groupId) ?? `Group #${schedule.groupId}`}</span> },
    { key: "dayOfWeek", header: "Day", render: (schedule) => humanizeEnum(schedule.dayOfWeek) },
    { key: "startTime", header: "Start", render: (schedule) => <span className="whitespace-nowrap tabular-nums">{formatSlotTime(schedule.startTime)}</span> },
    { key: "endTime", header: "End", render: (schedule) => <span className="whitespace-nowrap tabular-nums">{formatSlotTime(schedule.endTime)}</span> },
    { key: "actions", header: "", className: "w-24 text-right", render: (schedule) => canManage ? <div className="flex justify-end gap-1"><button type="button" aria-label={`Edit ${groupNames.get(schedule.groupId) ?? "schedule"} schedule`} onClick={() => { setEditingSchedule(schedule); setFormOpen(true); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground"><SquarePen className="size-4" aria-hidden /></button><button type="button" aria-label={`Delete ${groupNames.get(schedule.groupId) ?? "schedule"} schedule`} onClick={() => setDeletingSchedule(schedule)} className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 className="size-4" aria-hidden /></button></div> : null },
  ];

  return <>
    <PageHeader title="Schedules" description="Manage recurring weekly time slots for every group." actions={<PermissionGate resource="groupsAndSessions" action="manageSchedules"><button type="button" onClick={() => { setEditingSchedule(null); setFormOpen(true); }} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="size-4" aria-hidden />Add schedule</button></PermissionGate>} />
    <PermissionGate resource="groupsAndSessions" action="read"><FilterBar><select aria-label="Filter by group" value={groupId} onChange={(event) => updateFilters(() => setGroupId(event.target.value))} className={`${inputClassName} w-auto`}><option value="">All groups</option>{(groups.data?.items ?? []).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select><select aria-label="Filter by day" value={dayOfWeek} onChange={(event) => updateFilters(() => setDayOfWeek(event.target.value as typeof dayOfWeek))} className={`${inputClassName} w-auto`}><option value="ALL">All days</option>{DAYS_OF_WEEK.map((day) => <option key={day} value={day}>{humanizeEnum(day)}</option>)}</select></FilterBar>
    <DataTable columns={columns} rows={data?.items} getRowKey={(schedule) => schedule.id} isLoading={isLoading} error={error ?? null} onRetry={() => void refetch()} emptyTitle={groupId || dayOfWeek !== "ALL" ? "No schedules match your filters" : "No schedules yet"} emptyDescription="Add a recurring weekly slot to start planning classes." />
    {data && data.meta.totalPages > 0 ? <TablePagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} /> : null}</PermissionGate>
    <ScheduleFormDialog key={`${formOpen}-${editingSchedule?.id ?? "new"}`} open={formOpen} onClose={() => { setFormOpen(false); setEditingSchedule(null); }} schedule={editingSchedule} />
    <ConfirmDialog open={Boolean(deletingSchedule)} onCancel={() => setDeletingSchedule(null)} onConfirm={() => void confirmDelete()} title="Delete schedule?" message="Schedules with recorded sessions cannot be deleted." confirmLabel="Delete schedule" tone="danger" isLoading={deleteSchedule.isPending} />
  </>;
}
