"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi, attendanceKeys } from "@/features/attendance/api";
import type { Enrollment } from "@/features/enrollments/types";
import { ApiError } from "@/lib/api-client";

interface StudentTally {
  enrollmentId: number;
  name: string;
  present: number;
  absent: number;
}

async function fetchHistory(groupId: number): Promise<StudentTally[]> {
  const sessions = await attendanceApi.listSessions({ groupId, pageSize: 100 });
  const recordLists = await Promise.all(
    sessions.items.map((session) => attendanceApi.listRecords(session.id)),
  );
  const tallies = new Map<number, StudentTally>();
  for (const records of recordLists) {
    for (const record of records) {
      const tally = tallies.get(record.enrollmentId) ?? {
        enrollmentId: record.enrollmentId,
        name: record.student.fullName,
        present: 0,
        absent: 0,
      };
      if (record.status === "PRESENT") tally.present += 1;
      else tally.absent += 1;
      tallies.set(record.enrollmentId, tally);
    }
  }
  return [...tallies.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function AttendanceHistory({
  groupId,
  roster,
}: {
  groupId: number;
  roster: Enrollment[];
}) {
  const history = useQuery({
    queryKey: [...attendanceKeys.all, "history", groupId],
    queryFn: () => fetchHistory(groupId),
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
      <h2 className="text-sm font-semibold text-card-foreground">Attendance history</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        How many times each student has attended this group across all recorded sessions.
      </p>

      {history.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : history.error ? (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          Could not load attendance history
          {history.error instanceof ApiError ? `: ${history.error.message}` : "."}
        </p>
      ) : (history.data ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No attendance recorded yet. Open a session and save marks to build history.
        </p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">Student</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Attended</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Absent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(history.data ?? []).map((tally) => (
              <tr key={tally.enrollmentId}>
                <td className="py-2.5 pr-4">
                  <span className="font-medium text-card-foreground">{tally.name}</span>
                  {gradesById.get(tally.enrollmentId) ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {gradesById.get(tally.enrollmentId)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                  {tally.present}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400">
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
