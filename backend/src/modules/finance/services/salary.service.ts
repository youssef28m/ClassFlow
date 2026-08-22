import { Prisma } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { SalaryRepository } from '../repositories/salary.repository.js';
import type { SalaryDTO, SalaryPaginatedResponse } from '../types/salary.types.js';
import { toSalaryDTO } from '../types/salary.types.js';
import type {
  CreateSalaryInput,
  ListSalariesQuery,
  UpdateSalaryInput,
} from '../validation/salary.validation.js';

type RouteId = string | string[] | undefined;

export class SalaryService {
  constructor(private readonly repository: SalaryRepository) {}

  async create(input: CreateSalaryInput, centerId: number): Promise<SalaryDTO> {
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
    if (!(await this.repository.delete(this.parseId(id), centerId))) {
      throw new AppError('Teacher salary not found', 404);
    }
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
