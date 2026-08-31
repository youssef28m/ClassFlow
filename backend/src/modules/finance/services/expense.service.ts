import { AppError } from '../../../shared/middleware/error-handler.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';
import type { ExpenseRepository } from '../repositories/expense.repository.js';
import type { ExpenseDTO, ExpensePaginatedResponse } from '../types/expense.types.js';
import { toExpenseDTO } from '../types/expense.types.js';
import type { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from '../validation/expense.validation.js';

type RouteId = string | string[] | undefined;

export class ExpenseService {
  constructor(private readonly repository: ExpenseRepository) {}

  async create(input: CreateExpenseInput, centerId: number): Promise<ExpenseDTO> {
    return toExpenseDTO(await this.repository.create({ ...input, centerId }));
  }

  async getById(id: RouteId, centerId: number): Promise<ExpenseDTO> {
    const expense = await this.repository.findById(this.parseId(id), centerId);
    if (!expense) throw new AppError('Expense not found', 404);
    return toExpenseDTO(expense);
  }

  async update(id: RouteId, centerId: number, input: UpdateExpenseInput): Promise<ExpenseDTO> {
    const expense = await this.repository.update(this.parseId(id), centerId, input);
    if (!expense) throw new AppError('Expense not found', 404);
    return toExpenseDTO(expense);
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const parsedId = this.parseId(id);
    const expense = await this.repository.findById(parsedId, centerId);
    if (!expense) throw new AppError('Expense not found', 404);

    const salaryId = expense.salaryId;
    if (salaryId) {
      await prisma.$transaction(async (tx) => {
        await tx.expense.delete({ where: { id: parsedId } });
        await tx.teacherSalary.delete({ where: { id: salaryId } });
      });
    } else {
      await this.repository.delete(parsedId, centerId);
    }
  }

  async list(query: ListExpensesQuery, centerId: number | null): Promise<ExpensePaginatedResponse> {
    const { page, pageSize, category, from, to } = query;
    if (from && to && from > to) {
      throw new AppError('The from date must be before the to date', 400);
    }
    const { items, total } = await this.repository.findMany({
      category,
      from,
      to,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(toExpenseDTO),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') throw new AppError('Invalid expense id', 400);
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError('Invalid expense id', 400);
    return parsed;
  }
}
