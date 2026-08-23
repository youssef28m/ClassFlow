"use client";

import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PermissionGate } from "@/components/feedback/permission-gate";
import { useToast } from "@/components/feedback/toast";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/tables/status-badge";
import { EnrollStudentDialog } from "@/features/enrollments/components/enroll-student-dialog";
import {
  useDeleteEnrollment,
  useEnrollmentsQuery,
} from "@/features/enrollments/hooks";
import { useGroupsQuery } from "@/features/groups/hooks";
import { ScheduleManager } from "@/features/schedules/components/schedule-manager";
import { useSchedulesQuery } from "@/features/schedules/hooks";
import { SessionsPanel } from "@/features/attendance/components/sessions-panel";
import { AttendanceHistory } from "@/features/attendance/components/attendance-history";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can, hasPermission } from "@/lib/permissions";
import { useAuth } from "@/lib/auth-store";

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = Number(params?.id);
  const validGroupId = Number.isInteger(groupId) && groupId > 0;

  const { user } = useAuth();
  const toast = useToast();
  const { t, tEnum } = useI18n();
  const [enrollOpen, setEnrollOpen] = useState(false);
  const deleteEnrollment = useDeleteEnrollment();

  const groups = useGroupsQuery(
    validGroupId ? { page: 1, pageSize: 100 } : { page: 1, pageSize: 1 },
  );
  const group = useMemo(
    () =>
      validGroupId
        ? (groups.data?.items ?? []).find((item) => item.id === groupId) ?? null
        : null,
    [groups.data, groupId, validGroupId],
  );

  const enrollments = useEnrollmentsQuery({
    groupId: validGroupId ? groupId : -1,
    active: true,
    pageSize: 100,
  });
  const roster = useMemo(
    () => enrollments.data?.items ?? [],
    [enrollments.data],
  );
  const enrolledStudentIds = useMemo(
    () => roster.map((enrollment) => enrollment.studentId),
    [roster],
  );

  const schedulesQuery = useSchedulesQuery({
    groupId: validGroupId ? groupId : -1,
    pageSize: 100,
  });
  const schedules = schedulesQuery.data?.items ?? [];

  if (!validGroupId) {
    return (
      <>
        <PageHeader title={t("nav.groups")} description={t("groupDetail.invalidId")} />
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-card-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("groupDetail.backToGroups")}
        </Link>
      </>
    );
  }

  async function handleRemove(enrollmentId: number, studentName: string) {
    try {
      await deleteEnrollment.mutateAsync(enrollmentId);
      toast.success(t("groupDetail.removed", { name: studentName }));
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : t("common.somethingWentWrong"),
      );
    }
  }

  return (
    <>
      <Link
        href="/groups"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-card-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("groupDetail.allGroups")}
      </Link>

      {groups.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("groupDetail.loadingGroup")}</p>
      ) : groups.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {t("groupDetail.loadError")}
          {groups.error instanceof ApiError ? `: ${groups.error.message}` : "."}
        </p>
      ) : !group ? (
        <p className="text-sm text-muted-foreground">{t("groupDetail.notFound")}</p>
      ) : (
        <>
          <PageHeader
            title={group.name}
            description={t("groupDetail.metaLine", {
              subject: group.subject,
              room: group.room ?? "—",
              capacity: group.maxStudents,
              feeType: tEnum(group.paymentType),
              fee: group.fee,
            })}
          />

          <div className="mt-5">
            <SessionsPanel
              groupId={groupId}
              schedules={schedules}
              canManageSessions={hasPermission(user, "groupsAndSessions", "manageSessions")}
            />
          </div>

          <section className="mt-5 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-card-foreground">
                  {t("groupDetail.rosterTitle")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("groupDetail.rosterSubtitle")}
                </p>
              </div>
              <PermissionGate resource="students" action="create">
                <button
                  type="button"
                  onClick={() => setEnrollOpen(true)}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
                >
                  <UserPlus className="size-4" aria-hidden />
                  {t("students.add")}
                </button>
              </PermissionGate>
            </div>

            {enrollments.isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : roster.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("groupDetail.noEnrollments")}
              </p>
            ) : (
              <ul className="mt-4 max-h-96 divide-y divide-border overflow-y-auto rounded-xl border border-border scroll-slim">
                {roster.map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {enrollment.student.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.student.phone
                          ? t("groupDetail.phoneAndEnrolled", {
                              phone: enrollment.student.phone,
                              date: formatDate(enrollment.enrollmentDate),
                            })
                          : t("groupDetail.enrolledOn", {
                              date: formatDate(enrollment.enrollmentDate),
                            })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge tone="neutral">{enrollment.student.grade}</StatusBadge>
                      {can(user, "students", "delete") ? (
                        <button
                          type="button"
                          onClick={() =>
                            void handleRemove(
                              enrollment.id,
                              enrollment.student.fullName,
                            )
                          }
                          disabled={deleteEnrollment.isPending}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                        >
                          {t("common.remove")}
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-5">
            <ScheduleManager
              groupId={groupId}
              canManage={hasPermission(user, "groupsAndSessions", "manageSchedules")}
            />
          </div>

          <div className="mt-5">
            <AttendanceHistory groupId={groupId} roster={roster} />
          </div>
        </>
      )}

      <EnrollStudentDialog
        key={`${enrollOpen}`}
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        groupId={groupId}
        groupName={group?.name ?? "group"}
        enrolledStudentIds={enrolledStudentIds}
      />
    </>
  );
}
