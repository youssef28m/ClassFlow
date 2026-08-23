"use client";

import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { inputClassName } from "@/components/forms/field";
import { PageHeader } from "@/components/layout/page-header";
import { FilterBar } from "@/components/tables/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import { TeacherFormDialog } from "@/features/teachers/components/teacher-form-dialog";
import { useDeleteTeacher, useTeachersQuery } from "@/features/teachers/hooks";
import type { Teacher } from "@/features/teachers/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const PAGE_SIZE = 10;

export default function TeachersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const search = useDebouncedValue(searchText);
  const deleteTeacher = useDeleteTeacher();
  const filters = useMemo(() => ({ page, pageSize: PAGE_SIZE, search: search || undefined, active: activeFilter === "ALL" ? undefined : activeFilter === "true" }), [activeFilter, page, search]);
  const { data, isLoading, error, refetch } = useTeachersQuery(filters);
  const canEdit = can(user, "teachersAndSalaries", "updateTeacher");
  const canDelete = can(user, "teachersAndSalaries", "deleteTeacher");

  async function confirmDelete() {
    if (!deletingTeacher) return;
    try { await deleteTeacher.mutateAsync(deletingTeacher.id); toast.success("Teacher deleted"); }
    catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to delete teacher"); }
    finally { setDeletingTeacher(null); }
  }
  const columns: DataTableColumn<Teacher>[] = [
    { key: "fullName", header: "Name", render: (teacher) => <span className="font-medium">{teacher.fullName}</span> },
    { key: "specialization", header: "Specialization", className: "hidden sm:table-cell" },
    { key: "phone", header: "Phone", className: "hidden md:table-cell" },
    { key: "active", header: "Status", render: (teacher) => <StatusBadge tone={teacher.active ? "success" : "neutral"}>{teacher.active ? "Active" : "Inactive"}</StatusBadge> },
    { key: "actions", header: "", className: "w-24 text-right", render: (teacher) => <div className="flex justify-end gap-1">{canEdit ? <button type="button" aria-label={`Edit ${teacher.fullName}`} onClick={() => { setEditingTeacher(teacher); setFormOpen(true); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground"><SquarePen className="size-4" aria-hidden /></button> : null}{canDelete ? <button type="button" aria-label={`Delete ${teacher.fullName}`} onClick={() => setDeletingTeacher(teacher)} className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 className="size-4" aria-hidden /></button> : null}</div> },
  ];
  return <>
    <PageHeader title="Teachers" description="Manage teaching staff and specializations." actions={<PermissionGate resource="teachersAndSalaries" action="createTeacher"><button type="button" onClick={() => { setEditingTeacher(null); setFormOpen(true); }} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="size-4" aria-hidden />Add teacher</button></PermissionGate>} />
    <PermissionGate resource="teachersAndSalaries" action="readTeachers"><FilterBar><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="teacher-search" type="search" placeholder="Search name, phone, specialization…" value={searchText} onChange={(event) => { setPage(1); setSearchText(event.target.value); }} className={`${inputClassName} pl-9`} /></div><select aria-label="Filter by status" value={activeFilter} onChange={(event) => { setPage(1); setActiveFilter(event.target.value as typeof activeFilter); }} className={`${inputClassName} w-auto`}><option value="ALL">All teachers</option><option value="true">Active</option><option value="false">Inactive</option></select></FilterBar>
    <DataTable columns={columns} rows={data?.items} getRowKey={(teacher) => teacher.id} isLoading={isLoading} error={error ?? null} onRetry={() => void refetch()} emptyTitle={search || activeFilter !== "ALL" ? "No teachers match your filters" : "No teachers yet"} emptyDescription="Add teaching staff to begin creating groups." />
    {data && data.meta.totalPages > 0 ? <TablePagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} /> : null}</PermissionGate>
    <TeacherFormDialog key={`${formOpen}-${editingTeacher?.id ?? "new"}`} open={formOpen} onClose={() => { setFormOpen(false); setEditingTeacher(null); }} teacher={editingTeacher} />
    <ConfirmDialog open={Boolean(deletingTeacher)} onCancel={() => setDeletingTeacher(null)} onConfirm={() => void confirmDelete()} title={`Delete ${deletingTeacher?.fullName ?? "teacher"}?`} message="Teachers assigned to groups cannot be deleted. Reassign or remove their groups first." confirmLabel="Delete teacher" tone="danger" isLoading={deleteTeacher.isPending} />
  </>;
}
