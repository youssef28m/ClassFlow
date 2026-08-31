import type { Attendance, AttendanceStatus } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface AttendanceWrite {
  enrollmentId: number;
  status: AttendanceStatus;
  notes?: string | null;
}

export type AttendanceWithStudent = Attendance & {
  enrollment: { student: { id: number; fullName: string } };
};

export interface AttendanceTallyRow {
  enrollmentId: number;
  studentId: number;
  fullName: string;
  present: number;
  absent: number;
}

export class AttendanceRepository {
  async findActiveEnrollmentIds(enrollmentIds: number[], groupId: number): Promise<number[]> {
    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds }, groupId, active: true },
      select: { id: true },
    });
    return enrollments.map((enrollment) => enrollment.id);
  }

  findBySession(sessionId: number, centerId: number): Promise<AttendanceWithStudent[]> {
    return prisma.attendance.findMany({
      where: { sessionId, session: { group: { centerId } } },
      orderBy: { enrollment: { student: { fullName: 'asc' } } },
      include: { enrollment: { select: { student: { select: { id: true, fullName: true } } } } },
    });
  }

  async summarizeForGroup(groupId: number, centerId: number): Promise<AttendanceTallyRow[]> {
    const grouped = await prisma.attendance.groupBy({
      by: ['enrollmentId', 'status'],
      where: { session: { group: { id: groupId, centerId } } },
      _count: { _all: true },
    });
    const enrollmentIds = [...new Set(grouped.map((row) => row.enrollmentId))];
    if (enrollmentIds.length === 0) return [];

    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds }, groupId },
      select: { id: true, student: { select: { id: true, fullName: true } } },
    });
    const byEnrollment = new Map(enrollments.map((enrollment) => [enrollment.id, enrollment]));

    const tallies = new Map<number, AttendanceTallyRow>();
    for (const row of grouped) {
      const enrollment = byEnrollment.get(row.enrollmentId);
      if (!enrollment) continue;
      const tally = tallies.get(row.enrollmentId) ?? {
        enrollmentId: row.enrollmentId,
        studentId: enrollment.student.id,
        fullName: enrollment.student.fullName,
        present: 0,
        absent: 0,
      };
      if (row.status === 'PRESENT') tally.present += row._count._all;
      else tally.absent += row._count._all;
      tallies.set(row.enrollmentId, tally);
    }
    return [...tallies.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async replaceForSession(sessionId: number, records: AttendanceWrite[]): Promise<AttendanceWithStudent[]> {
    return prisma.$transaction(async (tx) => {
      const enrollmentIds = records.map((record) => record.enrollmentId);
      await tx.attendance.deleteMany({
        where: { sessionId, enrollmentId: { notIn: enrollmentIds } },
      });

      for (const record of records) {
        await tx.attendance.upsert({
          where: {
            enrollmentId_sessionId: { enrollmentId: record.enrollmentId, sessionId },
          },
          create: { sessionId, ...record },
          update: { status: record.status, notes: record.notes ?? null },
        });
      }

      return tx.attendance.findMany({
        where: { sessionId },
        orderBy: { enrollment: { student: { fullName: 'asc' } } },
        include: { enrollment: { select: { student: { select: { id: true, fullName: true } } } } },
      });
    });
  }
}
