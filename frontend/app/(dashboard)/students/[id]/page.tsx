"use client";

import { ArrowLeft, CalendarDays, GraduationCap, Phone, Plus, SquarePen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/feedback/error-state";
import { StatusBadge, type BadgeTone } from "@/components/tables/status-badge";
import { useStudentPaymentSummary } from "@/features/payments/hooks";
import { RecordPaymentDialog } from "@/features/payments/components/record-payment-dialog";
import { useStudentQuery } from "@/features/students/hooks";
import { StudentFormDialog } from "@/features/students/components/student-form-dialog";
import type { EnrollmentPaymentEntry } from "@/features/payments/payment-status";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/formatters";
import { can } from "@/lib/permissions";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const STATUS_TONES: Record<string, BadgeTone> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "danger",
};

const STATUS_LABEL_KEYS: Record<
  "PAID" | "PENDING" | "OVERDUE",
  TranslationKey
> = {
  PAID: "studentDetail.statusPaid",
  PENDING: "studentDetail.statusPending",
  OVERDUE: "studentDetail.statusOverdue",
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const studentId = Number(params?.id);
  const { user } = useAuth();
  const { t, tEnum } = useI18n();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const summary = useStudentPaymentSummary(Number.isInteger(studentId) ? studentId : null);
  const studentQuery = useStudentQuery(Number.isInteger(studentId) ? studentId : null);
  const canRecordPayment =
    can(user, "paymentsAndExpenses", "logPayment") ||
    can(user, "paymentsAndExpenses", "managePayments");
  const canEdit = can(user, "students", "update");

  if (summary.isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  if (summary.error || !summary.data) {
    return (
      <div className="mt-6">
        <ErrorState error={summary.error ?? null} onRetry={() => void summary.refetch()} />
      </div>
    );
  }

  const { student, enrollments, totals } = summary.data;

  return (
    <>
      <Link
        href="/students"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-card-foreground"
      >
        <ArrowLeft className="size-4 rtl-flip" aria-hidden />
        {t("students.title")}
      </Link>

      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-card-foreground">{student.fullName}</h1>
              <p className="text-sm text-muted-foreground">
                {student.grade}
                {student.school ? ` · ${student.school}` : ""}
              </p>
            </div>
            <StatusBadge
              tone={student.status === "ACTIVE" ? "success" : "neutral"}
            >
              {tEnum(student.status)}
            </StatusBadge>
            {canEdit ? (
              <button
                type="button"
                aria-label={t("common.edit")}
                title={t("common.edit")}
                onClick={() => setEditOpen(true)}
                disabled={!studentQuery.data}
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground disabled:pointer-events-none disabled:opacity-60"
              >
                <SquarePen className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          {canRecordPayment ? (
            <button
              type="button"
              onClick={() => setPaymentOpen(true)}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              {t("studentDetail.recordPayment")}
            </button>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">{t("students.columnPhone")}</dt>
            <dd dir="ltr" className="mt-0.5 inline-flex items-center gap-1.5 text-start text-card-foreground">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              {student.phone ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("students.columnGuardian")}</dt>
            <dd dir="ltr" className="mt-0.5 inline-flex items-center gap-1.5 text-start text-card-foreground">
              <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              {student.parentPhone ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("students.columnJoinDate")}</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1.5 text-card-foreground">
              <CalendarDays className="size-3.5 text-muted-foreground" aria-hidden />
              {formatDate(student.joinDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("studentDetail.totalPaid")}</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-card-foreground">
              {Number(totals.totalPaid).toLocaleString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">{t("payments.currency")}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-card-foreground">
          {t("studentDetail.enrollmentsTitle")}
        </h2>
        {enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("studentDetail.noEnrollments")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-start">
                  <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">{t("payments.columnGroup")}</th>
                  <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground md:table-cell">{t("groups.columnSubject")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">{t("payments.amount")}</th>
                  <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground sm:table-cell">{t("groups.columnPaymentType")}</th>
                  <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">{t("studentDetail.period")}</th>
                  <th scope="col" className="hidden px-4 py-3 text-start font-medium text-muted-foreground lg:table-cell">{t("studentDetail.lastPayment")}</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium text-muted-foreground">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((entry) => (
                  <EnrollmentRow key={entry.enrollmentId} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {enrollments.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{t("studentDetail.legendOverdue", { count: totals.overdueCount })}</span>
            <span>{t("studentDetail.legendPending", { count: totals.pendingCount })}</span>
            <span>{t("studentDetail.legendPaid", { count: totals.paidCount })}</span>
          </div>
        ) : null}
      </section>

      <RecordPaymentDialog
        key={`record-${paymentOpen}`}
        open={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          void summary.refetch();
        }}
        defaultStudentId={student.id}
        defaultStudentName={student.fullName}
      />

      <StudentFormDialog
        key={`edit-${editOpen}-${student.id}`}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          void summary.refetch();
          void studentQuery.refetch();
        }}
        student={studentQuery.data ?? null}
      />
    </>
  );

  function EnrollmentRow({ entry }: { entry: EnrollmentPaymentEntry }) {
    return (
      <tr className="border-b border-border last:border-b-0">
        <td className="px-4 py-3">
          <span className={`font-medium ${entry.active ? "" : "opacity-60"}`}>
            {entry.groupName}
            {!entry.active ? ` · ${t("studentDetail.inactive")}` : ""}
          </span>
        </td>
        <td className="hidden px-4 py-3 md:table-cell">{entry.subject}</td>
        <td className="tabular-nums">{Number(entry.totalPaid).toLocaleString()}</td>
        <td className="hidden sm:table-cell">{tEnum(entry.paymentType)}</td>
        <td className="hidden whitespace-nowrap px-4 py-3 tabular-nums lg:table-cell">
          {entry.periodStart && entry.dueDate
            ? `${formatDate(entry.periodStart)} → ${formatDate(entry.dueDate)}`
            : "—"}
        </td>
        <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
          {entry.lastPaymentDate ? formatDate(entry.lastPaymentDate) : "—"}
        </td>
        <td className="px-4 py-3">
          {entry.status ? (
            <StatusBadge tone={STATUS_TONES[entry.status]}>
              {t(STATUS_LABEL_KEYS[entry.status])}
              {entry.daysOverdue && entry.daysOverdue > 0
                ? ` · ${t("studentDetail.overdueDays", { count: entry.daysOverdue })}`
                : ""}
            </StatusBadge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      </tr>
    );
  }
}
