"use client";

import { Plus, Power, Search, Trash2 } from "lucide-react";
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
import { EnrollmentFormDialog } from "@/features/enrollments/components/enrollment-form-dialog";
import { useDeleteEnrollment, useEnrollmentsQuery, useSetEnrollmentStatus } from "@/features/enrollments/hooks";
import type { Enrollment } from "@/features/enrollments/types";
import { useGroupsQuery } from "@/features/groups/hooks";
import { useStudentsQuery } from "@/features/students/hooks";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";

const PAGE_SIZE = 10;

export default function EnrollmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "true" | "false">("ALL");
  const [studentId, setStudentId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deletingEnrollment, setDeletingEnrollment] = useState<Enrollment | null>(null);
  const students = useStudentsQuery({ pageSize: 100 });
  const groups = useGroupsQuery({ pageSize: 100 });
  const filters = useMemo(() => ({ page, pageSize: PAGE_SIZE, studentId: studentId ? Number(studentId) : undefined, groupId: groupId ? Number(groupId) : undefined, active: activeFilter === "ALL" ? undefined : activeFilter === "true" }), [activeFilter, groupId, page, studentId]);
  const { data, isLoading, error, refetch } = useEnrollmentsQuery(filters);
  const setStatus = useSetEnrollmentStatus();
  const deleteEnrollment = useDeleteEnrollment();
  const canUpdate = can(user, "students", "update");
  const canDelete = can(user, "students", "delete");

  async function changeStatus(enrollment: Enrollment) {
    try { await setStatus.mutateAsync({ id: enrollment.id, active: !enrollment.active }); toast.success(enrollment.active ? "Enrollment deactivated" : "Enrollment activated"); }
    catch (statusError) { toast.error(statusError instanceof ApiError ? statusError.message : "Failed to update enrollment"); }
  }
  async function confirmDelete() {
    if (!deletingEnrollment) return;
    try { await deleteEnrollment.mutateAsync(deletingEnrollment.id); toast.success("Enrollment deleted"); }
    catch (deleteError) { toast.error(deleteError instanceof ApiError ? deleteError.message : "Failed to delete enrollment"); }
    finally { setDeletingEnrollment(null); }
  }
  function updateFilters(update: () => void) { setPage(1); update(); }
  const columns: DataTableColumn<Enrollment>[] = [
    { key: "student", header: "Student", render: (enrollment) => <div><p className="font-medium">{enrollment.student.fullName}</p><p className="text-xs text-muted-foreground">{enrollment.student.grade}</p></div> },
    { key: "group", header: "Group", render: (enrollment) => <div><p>{enrollment.group.name}</p><p className="text-xs text-muted-foreground">{enrollment.group.subject}</p></div> },
    { key: "enrollmentDate", header: "Enrolled", className: "hidden md:table-cell", render: (enrollment) => formatDate(enrollment.enrollmentDate) },
    { key: "active", header: "Status", render: (enrollment) => <StatusBadge tone={enrollment.active ? "success" : "neutral"}>{enrollment.active ? "Active" : "Inactive"}</StatusBadge> },
    { key: "actions", header: "", className: "w-24 text-right", render: (enrollment) => <div className="flex justify-end gap-1">{canUpdate ? <button type="button" aria-label={`${enrollment.active ? "Deactivate" : "Activate"} ${enrollment.student.fullName}'s enrollment`} onClick={() => void changeStatus(enrollment)} disabled={setStatus.isPending} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-card-foreground disabled:opacity-50"><Power className="size-4" aria-hidden /></button> : null}{canDelete ? <button type="button" aria-label={`Delete ${enrollment.student.fullName}'s enrollment`} onClick={() => setDeletingEnrollment(enrollment)} className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 className="size-4" aria-hidden /></button> : null}</div> },
  ];
  return <>
    <PageHeader title="Enrollments" description="Place students in groups and track their enrollment status." actions={<PermissionGate resource="students" action="create"><button type="button" onClick={() => setFormOpen(true)} className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"><Plus className="size-4" aria-hidden />Enroll student</button></PermissionGate>} />
    <PermissionGate resource="students" action="read"><FilterBar><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><select aria-label="Filter by student" value={studentId} onChange={(event) => updateFilters(() => setStudentId(event.target.value))} className={`${inputClassName} pl-9`}><option value="">All students</option>{(students.data?.items ?? []).map((student) => <option key={student.id} value={student.id}>{student.fullName}</option>)}</select></div><select aria-label="Filter by group" value={groupId} onChange={(event) => updateFilters(() => setGroupId(event.target.value))} className={`${inputClassName} w-auto`}><option value="">All groups</option>{(groups.data?.items ?? []).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select><select aria-label="Filter by status" value={activeFilter} onChange={(event) => updateFilters(() => setActiveFilter(event.target.value as typeof activeFilter))} className={`${inputClassName} w-auto`}><option value="ALL">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></FilterBar>
    <DataTable columns={columns} rows={data?.items} getRowKey={(enrollment) => enrollment.id} isLoading={isLoading} error={error ?? null} onRetry={() => void refetch()} emptyTitle={studentId || groupId || activeFilter !== "ALL" ? "No enrollments match your filters" : "No enrollments yet"} emptyDescription="Enroll an active student into a group to get started." />
    {data && data.meta.totalPages > 0 ? <TablePagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} /> : null}</PermissionGate>
    <EnrollmentFormDialog key={String(formOpen)} open={formOpen} onClose={() => setFormOpen(false)} />
    <ConfirmDialog open={Boolean(deletingEnrollment)} onCancel={() => setDeletingEnrollment(null)} onConfirm={() => void confirmDelete()} title={`Delete ${deletingEnrollment?.student.fullName ?? "enrollment"}?`} message="This removes the student's enrollment from the group. Enrollments with payments cannot be deleted." confirmLabel="Delete enrollment" tone="danger" isLoading={deleteEnrollment.isPending} />
  </>;
}
