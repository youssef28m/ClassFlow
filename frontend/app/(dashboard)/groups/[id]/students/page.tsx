"use client";

import { ArrowLeft, Check, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { inputClassName } from "@/components/forms/field";
import { DataTable, type DataTableColumn } from "@/components/tables/data-table";
import { FilterBar } from "@/components/tables/filter-bar";
import { StatusBadge } from "@/components/tables/status-badge";
import { EnrollStudentDialog } from "@/features/enrollments/components/enroll-student-dialog";
import {
  useDeleteEnrollment,
  useEnrollmentsQuery,
  useUpdateEnrollmentDate,
} from "@/features/enrollments/hooks";
import type { Enrollment } from "@/features/enrollments/types";
import { useGroupQuery } from "@/features/groups/hooks";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";

export default function GroupRosterPage() {
  const params = useParams<{ id: string }>();
  const groupId = params?.id ? Number(params.id) : NaN;
  const validGroupId = Number.isInteger(groupId) && groupId > 0;

  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [searchText, setSearchText] = useState("");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState("");
  const [deletingEnrollment, setDeletingEnrollment] = useState<Enrollment | null>(null);
  const deleteEnrollment = useDeleteEnrollment();
  const updateDate = useUpdateEnrollmentDate();

  const group = useGroupQuery(validGroupId ? groupId : undefined);

  const enrollments = useEnrollmentsQuery({
    groupId: validGroupId ? groupId : -1,
    active: true,
    pageSize: 100,
  });
  const roster = useMemo(() => enrollments.data?.items ?? [], [enrollments.data]);
  const enrolledStudentIds = useMemo(
    () => roster.map((enrollment) => enrollment.studentId),
    [roster],
  );

  const filtered = useMemo(() => {
    if (!searchText) return roster;
    const query = searchText.toLowerCase();
    return roster.filter((enrollment) => {
      const name = enrollment.student.fullName.toLowerCase();
      const phone = (enrollment.student.phone ?? "").toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [roster, searchText]);

  async function handleRemove() {
    if (!deletingEnrollment) return;
    try {
      await deleteEnrollment.mutateAsync(deletingEnrollment.id);
      toast.success(t("groupDetail.removed", { name: deletingEnrollment.student.fullName }));
      setDeletingEnrollment(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
      setDeletingEnrollment(null);
    }
  }

  async function saveDate(enrollment: Enrollment, date: string) {
    if (!date) return;
    try {
      await updateDate.mutateAsync({ id: enrollment.id, enrollmentDate: date });
      toast.success(t("groupDetail.dateUpdated"));
      setEditingEnrollmentId(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
    }
  }

  if (!validGroupId) {
    return (
      <>
        <PageHeader
          title={t("groupRoster.title")}
          description={t("groupDetail.invalidId")}
        />
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground"
        >
          <ArrowLeft className="size-4 rtl-flip" aria-hidden />
          {t("groups.title")}
        </Link>
      </>
    );
  }

  const canEditEnrollmentDate = can(user, "students", "update");
  const canRemoveStudent = can(user, "students", "delete");

  const columns: DataTableColumn<Enrollment>[] = [
    {
      key: "student",
      header: t("students.columnName"),
      render: (entry) => (
        <Link
          href={`/students/${entry.studentId}`}
          className="font-medium text-card-foreground transition-colors hover:text-primary hover:underline"
        >
          {entry.student.fullName}
        </Link>
      ),
    },
    {
      key: "grade",
      header: t("students.columnGrade"),
      render: (entry) => (
        <StatusBadge tone="neutral">{entry.student.grade}</StatusBadge>
      ),
    },
    {
      key: "phone",
      header: t("students.columnPhone"),
      className: "hidden md:table-cell",
      render: (entry) => entry.student.phone ?? "—",
    },
    {
      key: "enrollmentDate",
      header: t("groupDetail.enrolledOnLabel"),
      className: "hidden sm:table-cell whitespace-nowrap",
      render: (entry) =>
        editingEnrollmentId === entry.id ? (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={editingDate}
              onChange={(event) => setEditingDate(event.target.value)}
              className={`${inputClassName} h-8 w-auto px-2 text-xs`}
              aria-label={t("groupDetail.enrolledOnLabel")}
            />
            <button
              type="button"
              aria-label={t("common.save")}
              onClick={() => void saveDate(entry, editingDate)}
              disabled={updateDate.isPending}
              className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
            >
              <Check className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={t("common.cancel")}
              onClick={() => setEditingEnrollmentId(null)}
              disabled={updateDate.isPending}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground disabled:opacity-50"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          formatDate(entry.enrollmentDate)
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-20 text-end",
      render: (entry) => (
        <div className="flex justify-end gap-1.5">
          {canEditEnrollmentDate ? (
            <button
              type="button"
              aria-label={t("common.edit")}
              onClick={() => {
                setEditingEnrollmentId(entry.id);
                setEditingDate(entry.enrollmentDate.slice(0, 10));
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          ) : null}
          {canRemoveStudent ? (
            <button
              type="button"
              aria-label={t("common.delete")}
              onClick={() => setDeletingEnrollment(entry)}
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
      <Link
        href={`/groups/${groupId}`}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-card-foreground"
      >
        <ArrowLeft className="size-4 rtl-flip" aria-hidden />
        {t("groupReport.backToGroup")}
      </Link>

      <PageHeader
        title={group.data?.name ?? t("groupRoster.title")}
        description={t("groupRoster.count", { count: roster.length })}
        actions={
          <PermissionGate resource="students" action="create">
            <button
              type="button"
              onClick={() => setEnrollOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <UserPlus className="size-4" aria-hidden />
              {t("students.add")}
            </button>
          </PermissionGate>
        }
      />

      <FilterBar>
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="roster-search"
            type="search"
            placeholder={t("groupRoster.searchPlaceholder")}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className={`${inputClassName} ps-9`}
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(entry) => entry.id}
        isLoading={enrollments.isLoading}
        error={enrollments.error ?? null}
        onRetry={() => void enrollments.refetch()}
        emptyTitle={
          searchText ? t("groupRoster.noMatches") : t("groupDetail.noEnrollments")
        }
      />

      <EnrollStudentDialog
        key={`${enrollOpen}`}
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        groupId={groupId}
        groupName={group?.data?.name ?? "group"}
        enrolledStudentIds={enrolledStudentIds}
      />

      <ConfirmDialog
        open={Boolean(deletingEnrollment)}
        onCancel={() => setDeletingEnrollment(null)}
        onConfirm={() => void handleRemove()}
        title={t("students.deleteTitle", {
          name: deletingEnrollment?.student.fullName ?? "",
        })}
        message={t("enrollments.deleteMessage")}
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteEnrollment.isPending}
      />
    </>
  );
}