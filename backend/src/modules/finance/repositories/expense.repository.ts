import type { Expense, ExpenseCategory, Prisma } from '../../../generated/prisma/client.js';
import { prisma } from '../../../shared/prisma/prisma-client.js';

export interface ExpenseFindManyParams {
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
  centerId: number | null;
  skip: number;
  take: number;
}

export class ExpenseRepository {
  create(data: Prisma.ExpenseUncheckedCreateInput): Promise<Expense> {
    return prisma.expense.create({ data });
  }

  findById(id: number, centerId: number): Promise<Expense | null> {
    return prisma.expense.findFirst({ where: { id, centerId } });
  }

  async update(
    id: number,
    centerId: number,
    data: Prisma.ExpenseUncheckedUpdateInput,
  ): Promise<Expense | null> {
    const result = await prisma.expense.updateMany({ where: { id, centerId }, data });
    if (result.count === 0) return null;
    return prisma.expense.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: number, centerId: number): Promise<boolean> {
    const result = await prisma.expense.deleteMany({ where: { id, centerId } });
    return result.count > 0;
  }

  async findMany(params: ExpenseFindManyParams): Promise<{ items: Expense[]; total: number }> {
    const where: Prisma.ExpenseWhereInput = {};
    if (params.centerId !== null) where.centerId = params.centerId;
    if (params.category !== undefined) where.category = params.category;
    if (params.from || params.to) {
      where.expenseDate = {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lte: params.to } : {}),
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.expense.findMany({
        where,
        orderBy: [{ expenseDate: 'desc' }, { id: 'desc' }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.expense.count({ where }),
    ]);
    return { items, total };
  }
}
