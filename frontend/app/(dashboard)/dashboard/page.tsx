"use client";

import { CalendarCheck, CalendarDays, Clock, MapPin, Wallet } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/error-state";
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

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
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

        {/* Trend mini chart */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-card-foreground">
              {t("dashboard.trendTitle")}
            </h2>
          </div>
          <TrendBars trend={trend} isLoading={overview.isLoading} />
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

function TrendBars({
  trend,
  isLoading,
}: {
  trend: Array<{ date: string; present: number; total: number }>;
  isLoading: boolean;
}) {
  const { t, locale } = useI18n();
  if (isLoading) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  return (
    <div dir="ltr" className="mt-4 flex h-16 items-end gap-1" role="img" aria-label={t("dashboard.trendAria")}>
      {trend.map((point) => {
        const height =
          point.total > 0 ? Math.max(8, Math.round((point.present / point.total) * 100)) : 4;
        const label = new Date(`${point.date}T00:00:00Z`).toLocaleDateString(
          locale === "ar" ? "ar-EG" : "en-GB",
          { day: "numeric", month: "short" },
        );
        return (
          <span
            key={point.date}
            title={`${label}: ${point.present}/${point.total}`}
            style={{ height: `${height}%` }}
            className={`min-w-1.5 flex-1 rounded-t-sm ${
              point.total > 0 ? "bg-primary/70 hover:bg-primary" : "bg-muted"
            }`}
          />
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
