import { Prisma } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';
import type { SalaryRepository } from '../repositories/salary.repository.js';
import type { SalaryCalculationResultDTO, SalaryDTO, SalaryPaginatedResponse, SalaryReportDTO } from '../types/salary.types.js';
import { toSalaryDTO } from '../types/salary.types.js';
import type {
  CalculateSalaryInput,
  ListSalariesQuery,
  PaySalaryInput,
  UpdateSalaryInput,
} from '../validation/salary.validation.js';

type RouteId = string | string[] | undefined;

export class SalaryService {
  constructor(private readonly repository: SalaryRepository) {}

  async calculate(input: CalculateSalaryInput, centerId: number): Promise<SalaryCalculationResultDTO> {
    const { from, to, teacherId, percentage } = input;
    if (from > to) {
      throw new AppError('The from date must be before the to date', 400);
    }

    if (teacherId !== undefined) {
      await this.ensureTeacher(teacherId, centerId);
    }

    const sums = await this.repository.sumPaymentsByTeacher(centerId, from, to, teacherId);
    const pct = Number(percentage);

    return {
      percentage: pct,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      teachers: sums.map((sum) => {
        const total = Number(sum.totalPayments);
        return {
          teacherId: sum.teacherId,
          teacherName: sum.teacherName,
          totalPayments: sum.totalPayments.toString(),
          calculatedSalary: ((total * pct) / 100).toFixed(2),
        };
      }),
    };
  }

  async pay(input: PaySalaryInput, centerId: number): Promise<SalaryDTO> {
    const { teacherId, from, to, percentage, paymentDate, notes } = input;
    if (from > to) {
      throw new AppError('The from date must be before the to date', 400);
    }

    await this.ensureTeacher(teacherId, centerId);

    const salaryMonth = paymentDate.getUTCMonth() + 1;
    const salaryYear = paymentDate.getUTCFullYear();

    const existing = await this.repository.findExisting(teacherId, salaryMonth, salaryYear);
    if (existing) {
      throw new AppError('A salary already exists for this teacher and month', 409);
    }

    const sums = await this.repository.sumPaymentsByTeacher(centerId, from, to, teacherId);
    const teacherSum = sums.find((s) => s.teacherId === teacherId);
    const paymentSum = teacherSum ? Number(teacherSum.totalPayments) : 0;
    const pct = Number(percentage);
    const amount = (paymentSum * pct) / 100;

    const teacherName = teacherSum?.teacherName ?? 'Teacher';

    const salary = await prisma.$transaction(async (tx) => {
      const record = await tx.teacherSalary.create({
        data: {
          teacherId,
          salaryMonth,
          salaryYear,
          amount,
          paymentSum,
          percentage: pct,
          paymentDate,
          isPaid: true,
          notes: notes ?? null,
        },
      });

      await tx.expense.create({
        data: {
          category: 'SALARIES',
          amount,
          expenseDate: paymentDate,
          description: teacherName,
          salaryId: record.id,
          centerId,
        },
      });

      return record;
    });

    return toSalaryDTO(salary);
  }

  async calculateForPreviousMonth(centerId: number): Promise<SalaryCalculationResultDTO> {
    const now = new Date();
    const prevMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
    const prevYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    const from = new Date(Date.UTC(prevYear, prevMonth, 1));
    const to = new Date(Date.UTC(prevYear, prevMonth + 1, 0));

    return this.calculate({ from, to, percentage: 70 }, centerId);
  }

  async payAllForPreviousMonth(centerId: number): Promise<{ created: number; skipped: number }> {
    const now = new Date();
    const prevMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1;
    const prevYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    const from = new Date(Date.UTC(prevYear, prevMonth, 1));
    const to = new Date(Date.UTC(prevYear, prevMonth + 1, 0));
    const salaryMonth = prevMonth + 1;
    const salaryYear = prevYear;
    const paymentDate = new Date(Date.UTC(prevYear, prevMonth + 1, 0));
    const percentage = 70;

    const sums = await this.repository.sumPaymentsByTeacher(centerId, from, to);
    let created = 0;
    let skipped = 0;

    for (const sum of sums) {
      const existing = await this.repository.findExisting(sum.teacherId, salaryMonth, salaryYear);
      if (existing) {
        skipped += 1;
        continue;
      }

      const paymentSum = Number(sum.totalPayments);
      const amount = (paymentSum * percentage) / 100;

      await prisma.$transaction(async (tx) => {
        const record = await tx.teacherSalary.create({
          data: {
            teacherId: sum.teacherId,
            salaryMonth,
            salaryYear,
            amount,
            paymentSum,
            percentage,
            paymentDate,
            isPaid: true,
            notes: 'Auto-calculated',
          },
        });

        await tx.expense.create({
          data: {
            category: 'SALARIES',
            amount,
            expenseDate: paymentDate,
            description: sum.teacherName,
            salaryId: record.id,
            centerId,
          },
        });
      });

      created += 1;
    }

    return { created, skipped };
  }

  async create(
    input: {
      teacherId: number;
      salaryMonth: number;
      salaryYear: number;
      amount: string;
      paymentSum: string;
      percentage: string;
      paymentDate: Date;
      isPaid?: boolean;
      notes?: string | null;
    },
    centerId: number,
  ): Promise<SalaryDTO> {
    await this.ensureTeacher(input.teacherId, centerId);
    try {
      return toSalaryDTO(await this.repository.create(input));
    } catch (error) {
      this.handleDuplicate(error);
      throw error;
    }
  }

  async getById(id: RouteId, centerId: number): Promise<SalaryDTO> {
    const salary = await this.repository.findById(this.parseId(id), centerId);
    if (!salary) throw new AppError('Teacher salary not found', 404);
    return toSalaryDTO(salary);
  }

  async update(id: RouteId, centerId: number, input: UpdateSalaryInput): Promise<SalaryDTO> {
    try {
      const salary = await this.repository.update(this.parseId(id), centerId, input);
      if (!salary) throw new AppError('Teacher salary not found', 404);
      return toSalaryDTO(salary);
    } catch (error) {
      this.handleDuplicate(error);
      throw error;
    }
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const parsedId = this.parseId(id);
    const salary = await this.repository.findById(parsedId, centerId);
    if (!salary) throw new AppError('Teacher salary not found', 404);

    await prisma.$transaction(async (tx) => {
      await tx.expense.deleteMany({
        where: { salaryId: parsedId },
      });
      await tx.teacherSalary.delete({ where: { id: parsedId } });
    });
  }

  async getReport(id: RouteId, centerId: number): Promise<SalaryReportDTO> {
    const data = await this.repository.getReportData(this.parseId(id), centerId);
    if (!data) throw new AppError('Teacher salary not found', 404);

    const { salary, groups } = data;
    let totalStudentPayments = 0;

    const reportGroups = groups.map((group) => {
      const students = group.enrollments
        .filter((e) => e.payments.length > 0)
        .map((enrollment) => {
          const studentTotal = enrollment.payments.reduce((sum, p) => sum + Number(p.amount), 0);
          totalStudentPayments += studentTotal;

          return {
            studentId: enrollment.student.id,
            studentName: enrollment.student.fullName,
            grade: enrollment.student.grade,
            school: enrollment.student.school,
            payments: enrollment.payments.map((p) => ({
              id: p.id,
              amount: p.amount.toString(),
              paymentDate: p.paymentDate.toISOString().slice(0, 10),
              method: p.paymentMethod,
            })),
            totalPaid: studentTotal.toFixed(2),
          };
        });

      const groupTotal = students.reduce((sum, s) => sum + Number(s.totalPaid), 0);

      return {
        groupId: group.id,
        groupName: group.name,
        subject: group.subject,
        fee: group.fee.toString(),
        studentCount: group.enrollments.length,
        students,
        groupTotal: groupTotal.toFixed(2),
      };
    });

    const totalStudents = groups.reduce((sum, g) => sum + g.enrollments.length, 0);

    return {
      salaryId: salary.id,
      teacherName: salary.teacher.fullName,
      salaryMonth: salary.salaryMonth,
      salaryYear: salary.salaryYear,
      amount: salary.amount.toString(),
      paymentSum: salary.paymentSum.toString(),
      percentage: salary.percentage.toString(),
      paymentDate: salary.paymentDate.toISOString().slice(0, 10),
      isPaid: salary.isPaid,
      groups: reportGroups,
      totalStudents,
      totalPayments: totalStudentPayments.toFixed(2),
    };
  }

  async list(query: ListSalariesQuery, centerId: number | null): Promise<SalaryPaginatedResponse> {
    const { page, pageSize, teacherId, salaryMonth, salaryYear, isPaid } = query;
    const { items, total } = await this.repository.findMany({
      teacherId,
      salaryMonth,
      salaryYear,
      isPaid,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(toSalaryDTO),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private async ensureTeacher(teacherId: number, centerId: number): Promise<void> {
    if (!(await this.repository.findTeacherInCenter(teacherId, centerId))) {
      throw new AppError('Teacher not found in this center', 400);
    }
  }

  private handleDuplicate(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('A salary already exists for this teacher and month', 409);
    }
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') throw new AppError('Invalid teacher salary id', 400);
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid teacher salary id', 400);
    }
    return parsed;
  }
}
