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

  async replaceForSession(
    sessionId: number,
    records: AttendanceWrite[],
  ): Promise<AttendanceWithStudent[]> {
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
