import { can } from '../../../shared/authz/permissions.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import type { PaymentRepository } from '../repositories/payment.repository.js';
import type {
  AvailablePeriodDTO,
  EnrollmentPaymentEntryDTO,
  PaginatedResponse,
  PaymentDTO,
  StudentPaymentSummaryDTO,
} from '../types/payment.types.js';
import { toPaymentDTO } from '../types/payment.types.js';
import type { CreatePaymentInput, ListPaymentsQuery, UpdatePaymentInput } from '../validation/payment.validation.js';
import {
  evaluateRecurring,
  firstPeriodStart,
  generatePeriodsWithAmounts,
  PERIOD_MONTHS,
  paymentCoversWindow,
} from './payment-cycle.js';

type RouteId = string | string[] | undefined;

export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async create(input: CreatePaymentInput, centerId: number): Promise<PaymentDTO> {
    await this.ensureEnrollment(input.enrollmentId, centerId);
    const createData = {
      ...input,
      targetPeriodStart: input.targetPeriodStart ?? null,
    };
    return toPaymentDTO(await this.repository.create(createData));
  }

  async availablePeriods(enrollmentIdRaw: RouteId, centerId: number): Promise<AvailablePeriodDTO[]> {
    const enrollmentId = this.parseId(enrollmentIdRaw);
    const enrollment = await this.repository.findActiveEnrollmentInCenter(enrollmentId, centerId);
    if (!enrollment) throw new AppError('Active enrollment not found in this center', 400);

    const periodMonths = PERIOD_MONTHS[enrollment.group.paymentType];
    if (periodMonths === null) return [];

    const [existingPayments] = await Promise.all([this.repository.findPaymentsForEnrollment(enrollmentId)]);

    const periods = generatePeriodsWithAmounts(
      new Date(enrollment.enrollmentDate),
      periodMonths,
      enrollment.group.billingAnchorDay,
      existingPayments.map((p) => ({
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        targetPeriodStart: p.targetPeriodStart,
      })),
      new Date(),
    );

    return periods.map((p) => ({
      periodStart: p.periodStart.toISOString().slice(0, 10),
      dueDate: p.dueDate.toISOString().slice(0, 10),
      status: p.status,
      totalPaid: p.totalPaid,
    }));
  }

  async getById(id: RouteId, centerId: number): Promise<PaymentDTO> {
    const payment = await this.repository.findById(this.parseId(id), centerId);
    if (!payment) throw new AppError('Payment not found', 404);
    return toPaymentDTO(payment);
  }

  async update(id: RouteId, centerId: number, input: UpdatePaymentInput): Promise<PaymentDTO> {
    const payment = await this.repository.update(this.parseId(id), centerId, input);
    if (!payment) throw new AppError('Payment not found', 404);
    return toPaymentDTO(payment);
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    if (!(await this.repository.delete(this.parseId(id), centerId))) {
      throw new AppError('Payment not found', 404);
    }
  }

  async list(query: ListPaymentsQuery, centerId: number | null): Promise<PaginatedResponse<PaymentDTO>> {
    const { page, pageSize, search, enrollmentId, groupId, paymentMethod, from, to } = query;
    if (from && to && from > to) throw new AppError('The from date must be before the to date', 400);
    const { items, total } = await this.repository.findMany({
      search,
      enrollmentId,
      groupId,
      paymentMethod,
      from,
      to,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(toPaymentDTO),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  /**
   * Per-enrollment payment tracking for one student. Each recurring
   * enrollment is evaluated against its current billing period: the period
   * starts on the enrollment's day-of-month anchor and ends one period later;
   * a payment made inside the window marks it PAID, otherwise it is PENDING
   * until the due date passes and OVERDUE afterwards.
   */
  async studentSummary(studentIdRaw: RouteId, centerId: number, user: AuthUser): Promise<StudentPaymentSummaryDTO> {
    if (!this.canSeePaymentStatus(user)) {
      throw new AppError('You do not have permission to view payment summaries', 403);
    }
    const studentId = this.parseId(studentIdRaw);
    const student = await this.repository.findStudentInCenter(studentId, centerId);
    if (!student) throw new AppError('Student not found', 404);

    const [enrollments, payments] = await Promise.all([
      this.repository.findEnrollmentsWithGroupForStudent(studentId),
      this.repository.findPaymentsForStudent(studentId),
    ]);

    const today = new Date();
    const paymentsByEnrollment = new Map<number, { amount: number; paymentDate: Date; targetPeriodStart: Date | null }[]>();
    for (const payment of payments) {
      const list = paymentsByEnrollment.get(payment.enrollmentId) ?? [];
      list.push({
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate,
        targetPeriodStart: payment.targetPeriodStart,
      });
      paymentsByEnrollment.set(payment.enrollmentId, list);
    }

    const entries: EnrollmentPaymentEntryDTO[] = enrollments.map((enrollment) => {
      const periodMonths = PERIOD_MONTHS[enrollment.group.paymentType];
      const enrolledOn = new Date(enrollment.enrollmentDate);
      const enrollmentPayments = paymentsByEnrollment.get(enrollment.id) ?? [];
      let status: EnrollmentPaymentEntryDTO['status'] = null;
      let periodStart: string | null = null;
      let dueDate: string | null = null;
      let daysOverdue: number | null = null;
      let periodPaid = 0;
      let lastPaymentDate: Date | null = null;

      if (periodMonths !== null && enrollment.active) {
        const evaluation = evaluateRecurring(
          enrolledOn,
          periodMonths,
          enrollment.group.billingAnchorDay,
          enrollmentPayments.map((p) => ({ paymentDate: p.paymentDate, targetPeriodStart: p.targetPeriodStart })),
          today,
        );
        status = evaluation.status;
        periodStart = evaluation.periodStart.toISOString().slice(0, 10);
        dueDate = evaluation.dueDate.toISOString().slice(0, 10);
        daysOverdue = evaluation.daysOverdue;

        // firstStart must match the value evaluateRecurring used internally so
        // the shared paymentCoversWindow applies the same first-period inclusive
        // exception when summing what was paid into the current window.
        const firstStart = firstPeriodStart(enrolledOn, enrollment.group.billingAnchorDay);

        for (const p of enrollmentPayments) {
          const inPeriod = paymentCoversWindow(p, evaluation.periodStart, firstStart, evaluation.dueDate);
          if (inPeriod) {
            periodPaid += p.amount;
          }
          if (!lastPaymentDate || p.paymentDate > lastPaymentDate) {
            lastPaymentDate = p.paymentDate;
          }
        }
      } else {
        for (const p of enrollmentPayments) {
          if (!lastPaymentDate || p.paymentDate > lastPaymentDate) {
            lastPaymentDate = p.paymentDate;
          }
        }
      }

      return {
        enrollmentId: enrollment.id,
        groupId: enrollment.group.id,
        groupName: enrollment.group.name,
        subject: enrollment.group.subject,
        fee: enrollment.group.fee.toString(),
        paymentType: enrollment.group.paymentType,
        active: enrollment.active,
        enrolledOn,
        totalPaid: periodPaid.toFixed(2),
        lastPaymentDate,
        periodStart,
        dueDate,
        status,
        daysOverdue,
      };
    });

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        grade: student.grade,
        school: student.school,
        phone: student.phone,
        parentPhone: student.parentPhone,
        joinDate: student.joinDate,
        status: student.status,
      },
      enrollments: entries,
      totals: {
        overdueCount: entries.filter((entry) => entry.status === 'OVERDUE').length,
        pendingCount: entries.filter((entry) => entry.status === 'PENDING').length,
        paidCount: entries.filter((entry) => entry.status === 'PAID').length,
        totalPaid: entries.reduce((sum, entry) => sum + Number(entry.totalPaid), 0).toFixed(2),
      },
    };
  }

  private canSeePaymentStatus(user: AuthUser): boolean {
    return (
      can(user, 'paymentsAndExpenses', 'read') ||
      can(user, 'paymentsAndExpenses', 'logPayment') ||
      can(user, 'paymentsAndExpenses', 'managePayments')
    );
  }

  private async ensureEnrollment(enrollmentId: number, centerId: number) {
    const enrollment = await this.repository.findActiveEnrollmentInCenter(enrollmentId, centerId);
    if (!enrollment) {
      throw new AppError('Active enrollment not found in this center', 400);
    }
    return enrollment;
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') throw new AppError('Invalid payment id', 400);
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError('Invalid payment id', 400);
    return parsed;
  }
}
