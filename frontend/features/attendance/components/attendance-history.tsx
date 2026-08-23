"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, attendanceKeys } from "@/features/attendance/api";
import type { Enrollment } from "@/features/enrollments/types";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

export function AttendanceHistory({
  groupId,
  roster,
}: {
  groupId: number;
  roster: Enrollment[];
}) {
  const { t } = useI18n();
  const history = useQuery({
    queryKey: attendanceKeys.summary(groupId),
    queryFn: () => attendanceApi.summary(groupId),
  });

  const gradesById = useMemo(() => {
    const map = new Map<number, string>();
    for (const enrollment of roster) {
      map.set(enrollment.id, enrollment.student.grade);
    }
    return map;
  }, [roster]);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-card-foreground">{t("history.title")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("history.subtitle")}
      </p>

      {history.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : history.error ? (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {t("history.loadError")}
          {history.error instanceof ApiError ? `: ${history.error.message}` : "."}
        </p>
      ) : (history.data ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("history.empty")}
        </p>
      ) : (
        <table className="mt-4 w-full text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pe-4 font-medium">{t("students.columnName")}</th>
              <th scope="col" className="px-4 py-2 text-end font-medium">{t("history.attended")}</th>
              <th scope="col" className="px-4 py-2 text-end font-medium">{t("history.absent")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(history.data ?? []).map((tally) => (
              <tr key={tally.enrollmentId}>
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-card-foreground">{tally.fullName}</span>
                  {gradesById.get(tally.enrollmentId) ? (
                    <span className="ms-2 text-xs text-muted-foreground">
                      {gradesById.get(tally.enrollmentId)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-end tabular-nums text-emerald-700 dark:text-emerald-400">
                  {tally.present}
                </td>
                <td className="px-4 py-2.5 text-end tabular-nums text-red-600 dark:text-red-400">
                  {tally.absent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
