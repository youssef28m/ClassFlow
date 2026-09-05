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
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { StatusBadge } from "@/components/tables/status-badge";
import { ROLE_TONE_CLASSES } from "@/components/navigation/nav-config";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatSlotTime } from "@/lib/formatters";
import { useDashboardOverview } from "@/features/dashboard/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, tEnum } = useI18n();
  const overview = useDashboardOverview();
  const [overdueSort, setOverdueSort] = useState<"days" | "amount">("days");

  const overdueItems = useMemo(() => {
    const items = overview.data?.overdueStudents?.items ?? [];
    if (overdueSort === "amount") {
      return [...items].sort(
        (a, b) => Number(b.fee) - Number(a.fee) || b.daysOverdue - a.daysOverdue,
      );
    }
    return items;
  }, [overview.data?.overdueStudents?.items, overdueSort]);

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
      <PageHeader title={t("dashboard.welcome", { name: user?.username ?? "" })} />

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
                {Number(collected.payments).toLocaleString()} {t("dashboard.payments")} − {Number(collected.expenses).toLocaleString()} {t("dashboard.expenses")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("dashboard.revenueTitle")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-primary/70" aria-hidden />
                  {t("dashboard.payments")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-red-400/70" aria-hidden />
                  {t("dashboard.expenses")}
                </span>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Number(annualTotal).toLocaleString()} {t("payments.currency")}
              </span>
            </div>
          </div>
          <RevenueBars items={overview.data.monthlyRevenue} isLoading={overview.isLoading} />
        </section>
      ) : null}

      {/* Recent payments */}
      {overview.data && overview.data.recentPayments.length > 0 ? (
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("dashboard.recentPaymentsTitle")}
              </h2>
            </div>
            <Link
              href="/payments"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("dashboard.viewAllPayments")}
            </Link>
          </div>

          <ul className="mt-3 divide-y divide-border">
            {overview.data.recentPayments.map((payment) => (
              <li key={payment.id}>
                <Link
                  href={`/students/${payment.studentId}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-card-foreground">
                      {payment.studentName}
                      <span className="ms-2 font-normal text-muted-foreground">
                        {payment.groupName}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDate(payment.paymentDate)} · {tEnum(payment.paymentMethod)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    +{Number(payment.amount).toLocaleString()} {t("payments.currency")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Late payments */}
      {overview.data?.overdueStudents ? (
        <section className="mt-5 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-amber-500" aria-hidden />
              <h2 className="text-sm font-semibold text-card-foreground">
                {t("dashboard.overdueTitle")}
              </h2>
              {overview.data.overdueStudents.total > 0 ? (
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium tabular-nums text-red-600 dark:text-red-400">
                  {overview.data.overdueStudents.total}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {overview.data.overdueStudents.total > 0 ? (
                <span className="text-sm tabular-nums text-red-600 dark:text-red-400">
                  {Number(overview.data.overdueStudents.outstandingAmount).toLocaleString()}{" "}
                  {t("payments.currency")}
                </span>
              ) : null}
              {overview.data.overdueStudents.items.length > 1 ? (
                <div className="flex rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setOverdueSort("days")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      overdueSort === "days"
                        ? "bg-muted text-card-foreground"
                        : "text-muted-foreground hover:text-card-foreground"
                    }`}
                  >
                    {t("dashboard.overdueSortDays")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverdueSort("amount")}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      overdueSort === "amount"
                        ? "bg-muted text-card-foreground"
                        : "text-muted-foreground hover:text-card-foreground"
                    }`}
                  >
                    {t("dashboard.overdueSortAmount")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {(overview.data.overdueStudents.items.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("dashboard.overdueEmpty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {overdueItems.map((entry) => (
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
            <Link
              href="/overdue"
              className="mt-3 block text-xs font-medium text-primary transition-colors hover:underline"
            >
              {t("dashboard.overdueMore", {
                count:
                  overview.data.overdueStudents.total -
                  overview.data.overdueStudents.items.length,
              })}
            </Link>
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
  items: Array<{ month: string; payments: string; expenses: string; total: string }>;
  isLoading: boolean;
}) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  if (isLoading) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>;
  }
  const max = Math.max(
    ...items.flatMap((item) => [Number(item.payments), Number(item.expenses)]),
    1,
  );
  const tag = locale === "ar" ? "ar-EG" : "en-US";
  const currency = t("payments.currency");
  const money = (value: number) => `${value.toLocaleString(tag)} ${currency}`;
  const compact = new Intl.NumberFormat(tag, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return (
    <div dir="ltr" className="relative mt-5">
      <div className="flex h-48 items-end gap-2 sm:gap-3">
        {items.map((item, index) => {
          const payments = Number(item.payments);
          const expenses = Number(item.expenses);
          const paymentsHeight = payments > 0 ? Math.max(6, Math.round((payments / max) * 100)) : 4;
          const expensesHeight = expenses > 0 ? Math.max(6, Math.round((expenses / max) * 100)) : 4;
          const label = new Date(`${item.month}-01T00:00:00Z`).toLocaleDateString(tag, {
            month: "short",
          });
          const fullLabel = new Date(`${item.month}-01T00:00:00Z`).toLocaleDateString(tag, {
            month: "long",
            year: "numeric",
          });
          const isActive = active === index;
          return (
            <div
              key={item.month}
              className="relative flex h-full min-w-0 cursor-pointer flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              role="button"
              tabIndex={0}
              aria-label={`${fullLabel} — ${t("dashboard.payments")}: ${payments.toLocaleString(tag)}, ${t("dashboard.expenses")}: ${expenses.toLocaleString(tag)}`}
            >
              <span className="mb-1 text-[10px] tabular-nums text-muted-foreground">
                {payments > 0 ? compact.format(payments) : ""}
              </span>
              <div className="relative flex items-end gap-1">
                {isActive ? (
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2"
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  >
                    <div className="min-w-40 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg">
                      <p className="font-semibold text-card-foreground">{fullLabel}</p>
                      <dl className="mt-1 space-y-0.5 tabular-nums">
                        <div className="flex items-center justify-between gap-4">
                          <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 rounded-sm bg-primary/70" aria-hidden />
                            {t("dashboard.payments")}
                          </dt>
                          <dd className="font-medium text-card-foreground">{money(payments)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 rounded-sm bg-red-400/70" aria-hidden />
                            {t("dashboard.expenses")}
                          </dt>
                          <dd className="font-medium text-card-foreground">{money(expenses)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-border pt-1">
                          <dt className="font-medium text-card-foreground">{t("dashboard.revenueTitle")}</dt>
                          <dd
                            className={`font-semibold ${
                              Number(item.total) < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {money(Math.abs(Number(item.total)))}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                ) : null}
                <span
                  style={{ height: `${paymentsHeight}px`, maxHeight: "8.5rem" }}
                  className={`w-3 rounded-t-sm transition-colors sm:w-4 ${payments > 0 ? (isActive ? "bg-primary" : "bg-primary/70") : "bg-muted"}`}
                />
                <span
                  style={{ height: `${expensesHeight}px`, maxHeight: "8.5rem" }}
                  className={`w-3 rounded-t-sm transition-colors sm:w-4 ${expenses > 0 ? (isActive ? "bg-red-400" : "bg-red-400/70") : "bg-muted"}`}
                />
              </div>
              <span className={`mt-1 text-[10px] ${isActive ? "font-semibold text-card-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
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