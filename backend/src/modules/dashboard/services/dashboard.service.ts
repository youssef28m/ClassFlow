import { can } from '../../../shared/authz/permissions.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import { evaluateRecurring, PERIOD_MONTHS } from '../../finance/services/payment-cycle.js';
import {
  buildTrend,
  type DashboardOverviewDTO,
  type OverdueStudentDTO,
  type OverdueStudentsDTO,
  TREND_DAYS,
  toTodaySessionDTO,
} from '../types/dashboard.types.js';

const REVENUE_MONTHS = 12;

const OVERDUE_LIST_LIMIT = 10;

export class DashboardService {
  async getOverdue(centerId: number): Promise<OverdueStudentsDTO> {
    const now = new Date();
    const [recurringEnrollments, periodPayments] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          active: true,
          student: { centerId },
          group: { paymentType: { not: 'PER_SESSION' } },
        },
        select: {
          id: true,
          enrollmentDate: true,
          student: { select: { id: true, fullName: true } },
          group: { select: { id: true, name: true, fee: true, paymentType: true } },
        },
      }),
      prisma.payment.findMany({
        where: { enrollment: { active: true, student: { centerId } } },
        select: { enrollmentId: true, paymentDate: true },
      }),
    ]);

    const paymentDatesByEnrollment = new Map<number, Date[]>();
    for (const payment of periodPayments) {
      const list = paymentDatesByEnrollment.get(payment.enrollmentId) ?? [];
      list.push(payment.paymentDate);
      paymentDatesByEnrollment.set(payment.enrollmentId, list);
    }

    const overdue: OverdueStudentDTO[] = [];
    for (const enrollment of recurringEnrollments) {
      const periodMonths = PERIOD_MONTHS[enrollment.group.paymentType];
      if (periodMonths === null) continue;
      const evaluation = evaluateRecurring(
        new Date(enrollment.enrollmentDate),
        periodMonths,
        paymentDatesByEnrollment.get(enrollment.id) ?? [],
        now,
      );
      if (evaluation.status === 'OVERDUE') {
        overdue.push({
          studentId: enrollment.student.id,
          groupId: enrollment.group.id,
          studentName: enrollment.student.fullName,
          groupName: enrollment.group.name,
          fee: enrollment.group.fee.toString(),
          dueDate: evaluation.dueDate.toISOString().slice(0, 10),
          daysOverdue: evaluation.daysOverdue ?? 1,
        });
      }
    }

    overdue.sort(
      (a, b) => b.daysOverdue - a.daysOverdue || a.studentName.localeCompare(b.studentName),
    );

    return { items: overdue, total: overdue.length };
  }

  async getOverview(user: AuthUser, centerId: number): Promise<DashboardOverviewDTO> {
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
    const trendStart = new Date(todayStart.getTime() - (TREND_DAYS - 1) * 86_400_000);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const canSeePayments =
      can(user, 'paymentsAndExpenses', 'read') ||
      can(user, 'paymentsAndExpenses', 'logPayment') ||
      can(user, 'paymentsAndExpenses', 'managePayments');

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

    const revenueStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (REVENUE_MONTHS - 1), 1),
    );

    const [
      todaySessions,
      trendSessions,
      monthAggregate,
      monthExpenses,
      recurringEnrollments,
      periodPayments,
      revenuePayments,
    ] = await Promise.all([
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
      can(user, 'paymentsAndExpenses', 'read')
        ? prisma.expense.aggregate({
            where: {
              centerId,
              expenseDate: { gte: monthStart, lt: nextMonthStart },
            },
            _sum: { amount: true },
          })
        : Promise.resolve(null),
      canSeePayments
        ? prisma.enrollment.findMany({
            where: {
              active: true,
              student: { centerId },
              group: { paymentType: { not: 'PER_SESSION' } },
            },
            select: {
              id: true,
              enrollmentDate: true,
              student: { select: { id: true, fullName: true } },
              group: { select: { id: true, name: true, fee: true, paymentType: true } },
            },
          })
        : Promise.resolve([]),
      canSeePayments
        ? prisma.payment.findMany({
            where: { enrollment: { active: true, student: { centerId } } },
            select: { enrollmentId: true, paymentDate: true },
          })
        : Promise.resolve([]),
      canSeePayments
        ? prisma.payment.findMany({
            where: {
              enrollment: { student: { centerId } },
              paymentDate: { gte: revenueStart, lt: nextMonthStart },
            },
            select: { amount: true, paymentDate: true },
          })
        : Promise.resolve([]),
    ]);

    let monthCollected: DashboardOverviewDTO['monthCollected'] = null;
    if (monthAggregate) {
      const paymentsTotal = Number(monthAggregate._sum.amount ?? 0);
      const expensesTotal = Number(monthExpenses?._sum.amount ?? 0);
      monthCollected = {
        total: (paymentsTotal - expensesTotal).toFixed(2),
        payments: monthAggregate._sum.amount?.toString() ?? '0',
        expenses: monthExpenses?._sum.amount?.toString() ?? '0',
        count: monthAggregate._count,
      };
    }

    let overdueStudents: DashboardOverviewDTO['overdueStudents'] = null;
    if (canSeePayments) {
      const paymentDatesByEnrollment = new Map<number, Date[]>();
      for (const payment of periodPayments) {
        const list = paymentDatesByEnrollment.get(payment.enrollmentId) ?? [];
        list.push(payment.paymentDate);
        paymentDatesByEnrollment.set(payment.enrollmentId, list);
      }
      const overdue: OverdueStudentDTO[] = [];
      for (const enrollment of recurringEnrollments) {
        const periodMonths = PERIOD_MONTHS[enrollment.group.paymentType];
        if (periodMonths === null) continue;
        const evaluation = evaluateRecurring(
          new Date(enrollment.enrollmentDate),
          periodMonths,
          paymentDatesByEnrollment.get(enrollment.id) ?? [],
          now,
        );
        if (evaluation.status === 'OVERDUE') {
          overdue.push({
            studentId: enrollment.student.id,
            groupId: enrollment.group.id,
            studentName: enrollment.student.fullName,
            groupName: enrollment.group.name,
            fee: enrollment.group.fee.toString(),
            dueDate: evaluation.dueDate.toISOString().slice(0, 10),
            daysOverdue: evaluation.daysOverdue ?? 1,
          });
        }
      }
      overdue.sort(
        (a, b) => b.daysOverdue - a.daysOverdue || a.studentName.localeCompare(b.studentName),
      );
      overdueStudents = { items: overdue.slice(0, OVERDUE_LIST_LIMIT), total: overdue.length };
    }

    let monthlyRevenue: DashboardOverviewDTO['monthlyRevenue'] = null;
    if (canSeePayments) {
      const buckets = new Map<string, number>();
      for (let offset = REVENUE_MONTHS - 1; offset >= 0; offset -= 1) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
        buckets.set(date.toISOString().slice(0, 7), 0);
      }
      for (const payment of revenuePayments) {
        const key = payment.paymentDate.toISOString().slice(0, 7);
        if (!buckets.has(key)) continue;
        buckets.set(key, (buckets.get(key) ?? 0) + Number(payment.amount));
      }
      monthlyRevenue = [...buckets.entries()].map(([month, total]) => ({
        month,
        total: total.toFixed(2),
      }));
    }

    return {
      monthlyRevenue,
      todaySessions: todaySessions
        .map(toTodaySessionDTO)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      attendanceTrend: buildTrend(trendSessions, trendStart.getTime(), TREND_DAYS),
      monthCollected,
      overdueStudents,
    };
  }
}
