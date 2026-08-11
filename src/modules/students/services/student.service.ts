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

export class StudentService {
  constructor(private readonly repository: StudentRepository) {}

  async create(input: CreateStudentInput, centerId: number): Promise<StudentDTO> {
    const student = await this.repository.create({ ...input, centerId });
    return toStudentDTO(student);
  }

  async getById(id: RouteId, centerId: number): Promise<StudentDTO> {
    const student = await this.repository.findById(this.parseId(id), centerId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return toStudentDTO(student);
  }

  async update(id: RouteId, centerId: number, input: UpdateStudentInput): Promise<StudentDTO> {
    const student = await this.repository.update(this.parseId(id), centerId, input);
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return toStudentDTO(student);
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const deleted = await this.repository.delete(this.parseId(id), centerId);
    if (!deleted) {
      throw new AppError('Student not found', 404);
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
