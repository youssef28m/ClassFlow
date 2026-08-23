import { can } from '../../../shared/authz/permissions.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import {
  buildTrend,
  type DashboardOverviewDTO,
  TREND_DAYS,
  toTodaySessionDTO,
} from '../types/dashboard.types.js';

export class DashboardService {
  async getOverview(user: AuthUser, centerId: number): Promise<DashboardOverviewDTO> {
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
    const trendStart = new Date(todayStart.getTime() - (TREND_DAYS - 1) * 86_400_000);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const sessionSelect = {
      id: true,
      groupId: true,
      completed: true,
      sessionDate: true,
      schedule: { select: { startTime: true, endTime: true } },
      group: {
        select: { name: true, room: true, teacher: { select: { fullName: true } } },
      },
      attendanceRecords: { select: { status: true } },
    } as const;

    const [todaySessions, trendSessions, monthAggregate] = await Promise.all([
      prisma.session.findMany({
        where: { group: { centerId }, sessionDate: { gte: todayStart, lt: tomorrowStart } },
        select: sessionSelect,
      }),
      prisma.session.findMany({
        where: {
          group: { centerId },
          sessionDate: { gte: trendStart, lt: tomorrowStart },
        },
        select: { sessionDate: true, attendanceRecords: { select: { status: true } } },
      }),
      can(user, 'paymentsAndExpenses', 'read')
        ? prisma.payment.aggregate({
            where: {
              enrollment: { student: { centerId } },
              paymentDate: { gte: monthStart, lt: nextMonthStart },
            },
            _sum: { amount: true },
            _count: true,
          })
        : Promise.resolve(null),
    ]);

    let monthCollected: DashboardOverviewDTO['monthCollected'] = null;
    if (monthAggregate) {
      monthCollected = {
        total: monthAggregate._sum.amount?.toString() ?? '0',
        count: monthAggregate._count,
      };
    }

    return {
      todaySessions: todaySessions
        .map(toTodaySessionDTO)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      attendanceTrend: buildTrend(trendSessions, trendStart.getTime(), TREND_DAYS),
      monthCollected,
    };
  }
}
