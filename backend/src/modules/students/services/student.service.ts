import { Prisma } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { StudentRepository } from '../repositories/student.repository.js';
import type { PaginatedResponse, StudentDTO } from '../types/student.types.js';
import { toStudentDTO } from '../types/student.types.js';
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from '../validation/student.validation.js';

type RouteId = string | string[] | undefined;

const DUPLICATE_MESSAGE = 'A student with this name and phone already exists in this center';

export class StudentService {
  constructor(private readonly repository: StudentRepository) {}

  async create(input: CreateStudentInput, centerId: number): Promise<StudentDTO> {
    await this.assertNoDuplicate(centerId, input.fullName, input.phone ?? null);

    try {
      const student = await this.repository.create({ ...input, centerId });
      return toStudentDTO(student);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(DUPLICATE_MESSAGE, 409);
      }
      throw error;
    }
  }

  async getById(id: RouteId, centerId: number): Promise<StudentDTO> {
    const student = await this.repository.findById(this.parseId(id), centerId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return toStudentDTO(student);
  }

  async update(id: RouteId, centerId: number, input: UpdateStudentInput): Promise<StudentDTO> {
    const parsedId = this.parseId(id);

    const existing = await this.repository.findById(parsedId, centerId);
    if (!existing) {
      throw new AppError('Student not found', 404);
    }

    const fullName = input.fullName ?? existing.fullName;
    const phone = input.phone === undefined ? existing.phone : input.phone;
    await this.assertNoDuplicate(centerId, fullName, phone, parsedId);

    try {
      const student = await this.repository.update(parsedId, centerId, input);
      if (!student) {
        throw new AppError('Student not found', 404);
      }
      return toStudentDTO(student);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(DUPLICATE_MESSAGE, 409);
      }
      throw error;
    }
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const deleted = await this.repository.delete(this.parseId(id), centerId);
    if (!deleted) {
      throw new AppError('Student not found', 404);
    }
  }

  private async assertNoDuplicate(
    centerId: number,
    fullName: string,
    phone: string | null,
    excludeId?: number,
  ): Promise<void> {
    if (phone === null) {
      return;
    }
    const duplicate = await this.repository.findDuplicate(centerId, fullName, phone);
    if (duplicate && duplicate.id !== excludeId) {
      throw new AppError(DUPLICATE_MESSAGE, 409);
    }
  }

  async list(
    query: ListStudentsQuery,
    centerId: number | null,
  ): Promise<PaginatedResponse<StudentDTO>> {
    const { page, pageSize, search, status } = query;
    const { items, total } = await this.repository.findMany({
      search,
      status,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(toStudentDTO),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') {
      throw new AppError('Invalid student id', 400);
    }
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid student id', 400);
    }
    return parsed;
  }
}
