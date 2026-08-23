"use client";

import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
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
import { StatusBadge, type BadgeTone } from "@/components/tables/status-badge";
import { TablePagination } from "@/components/tables/table-pagination";
import { inputClassName } from "@/components/forms/field";
import { StudentFormDialog } from "@/features/students/components/student-form-dialog";
import {
  useDeleteStudent,
  useStudentsQuery,
} from "@/features/students/hooks";
import { STUDENT_STATUSES, type Student, type StudentStatus } from "@/features/students/types";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const STATUS_TONES: Record<StudentStatus, BadgeTone> = {
  ACTIVE: "success",
  INACTIVE: "warning",
  SUSPENDED: "danger",
};

const PAGE_SIZE = 10;

export default function StudentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | StudentStatus>("ALL");
  const [page, setPage] = useState(1);
  const search = useDebouncedValue(searchText);
  const deleteStudent = useDeleteStudent();

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
    [page, search, statusFilter],
  );

  const { data, isLoading, error, refetch } = useStudentsQuery(filters);

  function updateFilters(update: () => void) {
    setPage(1);
    update();
  }

  async function handleConfirmDelete() {
    if (!deletingStudent) return;
    try {
      await deleteStudent.mutateAsync(deletingStudent.id);
      toast.success(t("students.deleted"));
      setDeletingStudent(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof ApiError
          ? deleteError.message
          : t("common.somethingWentWrong"),
      );
      setDeletingStudent(null);
    }
  }

  const columns: DataTableColumn<Student>[] = [
    {
      key: "fullName",
      header: t("students.columnName"),
      render: (student) => (
        <span className="font-medium">{student.fullName}</span>
      ),
    },
    {
      key: "phone",
      header: t("students.columnPhone"),
      render: (student) => student.phone ?? "—",
    },
    {
      key: "parentPhone",
      header: t("students.columnGuardian"),
      className: "hidden md:table-cell",
      render: (student) => student.parentPhone ?? "—",
    },
    {
      key: "grade",
      header: t("students.columnGrade"),
      className: "hidden sm:table-cell",
    },
    {
      key: "school",
      header: t("students.columnSchool"),
      className: "hidden lg:table-cell",
      render: (student) => student.school ?? "—",
    },
    {
      key: "joinDate",
      header: t("students.columnJoinDate"),
      className: "hidden xl:table-cell whitespace-nowrap",
      render: (student) => formatDate(student.joinDate),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (student) => (
        <StatusBadge tone={STATUS_TONES[student.status]}>
          {tEnum(student.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-end",
      render: (student) => (
        <div className="flex justify-end gap-1">
          {can(user, "students", "update") ? (
            <button
              type="button"
              aria-label={t("common.edit")}
              onClick={() => {
                setEditingStudent(student);
                setFormOpen(true);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
            >
              <SquarePen className="size-4" aria-hidden />
            </button>
          ) : null}
          {can(user, "students", "delete") ? (
            <button
              type="button"
              aria-label={t("common.delete")}
              onClick={() => setDeletingStudent(student)}
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
        title={t("students.title")}
        description={t("students.description")}
        actions={
          <PermissionGate resource="students" action="create">
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setFormOpen(true);
              }}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              {t("students.add")}
            </button>
          </PermissionGate>
        }
      />

      <PermissionGate resource="students" action="read">
        <FilterBar>
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="student-search"
              type="search"
              placeholder={t("students.searchPlaceholder")}
              value={searchText}
              onChange={(event) =>
                updateFilters(() => setSearchText(event.target.value))
              }
              className={`${inputClassName} ps-9`}
            />
          </div>
          <select
            id="student-status-filter"
            aria-label={t("attendance.filterStatus")}
            value={statusFilter}
            onChange={(event) =>
              updateFilters(() => {
                setStatusFilter(event.target.value as typeof statusFilter);
              })
            }
            className={`${inputClassName} w-auto`}
          >
            <option value="ALL">{t("attendance.allStatuses")}</option>
            {STUDENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {tEnum(status)}
              </option>
            ))}
          </select>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={data?.items}
          getRowKey={(student) => student.id}
          isLoading={isLoading}
          error={error ?? null}
          onRetry={() => void refetch()}
          emptyTitle={
            search || statusFilter !== "ALL"
              ? t("students.emptyFiltered")
              : t("students.empty")
          }
          emptyDescription={t("students.emptyDescription")}
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

      <StudentFormDialog
        key={`${formOpen}-${editingStudent?.id ?? "new"}`}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
      />

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        onCancel={() => setDeletingStudent(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={deletingStudent ? t("students.deleteTitle", { name: deletingStudent.fullName }) : t("students.deleteTitle", { name: "" })}
        message={t("students.deleteMessage")}
        confirmLabel={t("common.delete")}
        tone="danger"
        isLoading={deleteStudent.isPending}
      />
    </>
  );
}
