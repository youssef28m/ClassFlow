"use client";

import {
  CalendarCheck,
  CalendarDays,
  Clock,
  MapPin,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { StatusBadge } from "@/components/tables/status-badge";
import { ROLE_TONE_CLASSES } from "@/components/navigation/nav-config";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatSlotTime } from "@/lib/formatters";
import { useDashboardOverview } from "@/features/dashboard/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const overview = useDashboardOverview();

  const trend = overview.data?.attendanceTrend ?? [];
  const totals = trend.reduce(
    (accumulator, point) => ({
      present: accumulator.present + point.present,
      total: accumulator.total + point.total,
    }),
    { present: 0, total: 0 },
  );
  const rate = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : null;
  const annualTotal = (overview.data?.monthlyRevenue ?? []).reduce(
    (accumulator, point) => accumulator + Number(point.total),
    0,
  );
  const collected = overview.data?.monthCollected ?? null;

  return (
    <>
      <PageHeader
        title={t("dashboard.welcome", { name: user?.username ?? "" })}
        description={t("dashboard.description")}
      />

      {user ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-6 py-5">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-card-foreground">{user.username}</p>
            <p className="text-sm text-muted-foreground">
              {resolveCenterLabel(user.centerId, t)}
            </p>
          </div>
          <span
            className={`ms-auto rounded-full px-3 py-1 text-xs font-medium ${ROLE_TONE_CLASSES[user.role] ?? ""}`}
          >
            {user.role}
          </span>
        </div>
      ) : null}

      {overview.error ? (
        <div className="mt-5">
          <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Collected this month */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-card-foreground">
              {t("dashboard.collectedTitle")}
            </h2>
          </div>
          {overview.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : collected ? (
            <>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-card-foreground">
                {Number(collected.total).toLocaleString()}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {t("payments.currency")}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.collectedCount", { count: collected.count })}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("dashboard.collectedUnavailable")}
            </p>
          )}
        </section>

        {/* Attendance rate (28d) */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-card-foreground">
              {t("dashboard.rateTitle")}
            </h2>
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums text-card-foreground">
            {rate !== null ? `${rate}%` : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.rateSubtitle", { days: 28 })}
          </p>
        </section>

      </div>

      {/* Today's sessions */}
      <section className="mt-5 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-card-foreground">
            {t("dashboard.todayTitle")}
          </h2>
          <Link
            href="/attendance"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.viewAllAttendance")}
          </Link>
        </div>

        {overview.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (overview.data?.todaySessions.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.noSessionsToday")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {(overview.data?.todaySessions ?? []).map((session) => (
              <li key={session.id}>
                <Link
                  href={`/attendance/${session.id}`}
                  className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="w-24 shrink-0 tabular-nums text-sm text-muted-foreground">
                    {formatSlotTime(session.startTime)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-card-foreground">
                      {session.groupName}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden />
                        {formatSlotTime(session.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" aria-hidden />
                        {session.room}
                      </span>
                      {session.teacherName ? <span>{session.teacherName}</span> : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {session.expectedCount > 0
                      ? t("dashboard.attendanceShort", {
                          present: session.presentCount,
                          total: session.expectedCount,
                        })
                      : ""}
                  </span>
                  <StatusDot completed={session.completed} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* Revenue across the year */}
      {overview.data?.monthlyRevenue ? (
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("dashboard.revenueTitle")}
              </h2>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {Number(annualTotal).toLocaleString()} {t("payments.currency")}
            </span>
          </div>
          <RevenueBars items={overview.data.monthlyRevenue} isLoading={overview.isLoading} />
        </section>
      ) : null}

      {/* Late payments */}
      {overview.data?.overdueStudents ? (
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-amber-500" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("dashboard.overdueTitle")}
              </h2>
            </div>
            {overview.data.overdueStudents.total > 0 ? (
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium tabular-nums text-red-600 dark:text-red-400">
                {overview.data.overdueStudents.total}
              </span>
            ) : null}
          </div>

          {(overview.data.overdueStudents.items.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.overdueEmpty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {overview.data.overdueStudents.items.map((entry) => (
                <li key={`${entry.studentId}-${entry.groupId}`}>
                  <Link
                    href={`/students/${entry.studentId}`}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">
                      {entry.studentName}
                      <span className="ms-2 font-normal text-muted-foreground">
                        {entry.groupName}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {Number(entry.fee).toLocaleString()} {t("payments.currency")}
                    </span>
                    <StatusBadge tone="danger">
                      {t("studentDetail.statusOverdue")} ·{" "}
                      {t("studentDetail.overdueDays", { count: entry.daysOverdue })}
                    </StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {overview.data.overdueStudents.total >
          overview.data.overdueStudents.items.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("dashboard.overdueMore", {
                count:
                  overview.data.overdueStudents.total -
                  overview.data.overdueStudents.items.length,
              })}
            </p>
          ) : null}
        </section>
      ) : null}

    </>
  );
}

function StatusDot({ completed }: { completed: boolean }) {
  return (
    <span
      className={`size-2 shrink-0 rounded-full ${completed ? "bg-emerald-500" : "bg-amber-500"}`}
      aria-hidden
    />
  );
}

function RevenueBars({
  items,
  isLoading,
}: {
  items: Array<{ month: string; total: string }>;
  isLoading: boolean;
}) {
  const { t, locale } = useI18n();
  if (isLoading) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  const max = Math.max(...items.map((item) => Number(item.total)), 1);
  const tag = locale === "ar" ? "ar-EG" : "en-US";
  return (
    <div dir="ltr" className="mt-5 flex h-44 items-end gap-2 sm:gap-3">
      {items.map((item) => {
        const value = Number(item.total);
        const height = value > 0 ? Math.max(6, Math.round((value / max) * 100)) : 3;
        const label = new Date(`${item.month}-01T00:00:00Z`).toLocaleDateString(tag, {
          month: "short",
        });
        const compact = new Intl.NumberFormat(tag, {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(value);
        return (
          <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {value > 0 ? compact : ""}
            </span>
            <span
              style={{ height: `${height}%` }}
              title={`${label}: ${value.toLocaleString(tag)}`}
              className={`w-full rounded-t-sm ${value > 0 ? "bg-primary/70 hover:bg-primary" : "bg-muted"}`}
            />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function resolveCenterLabel(
  centerId: number | null,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (centerId == null) return t("dashboard.globalAccess");
  return t("dashboard.workingInCenter", { id: centerId });
}
