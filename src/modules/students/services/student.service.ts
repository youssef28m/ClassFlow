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

  async create(input: CreateStudentInput): Promise<StudentDTO> {
    const student = await this.repository.create(input);
    return toStudentDTO(student);
  }

  async getById(id: RouteId): Promise<StudentDTO> {
    const student = await this.repository.findById(this.parseId(id));
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    return toStudentDTO(student);
  }

  async update(id: RouteId, input: UpdateStudentInput): Promise<StudentDTO> {
    const parsedId = this.parseId(id);
    const existing = await this.repository.findById(parsedId);
    if (!existing) {
      throw new AppError('Student not found', 404);
    }
    const student = await this.repository.update(parsedId, input);
    return toStudentDTO(student);
  }

  async delete(id: RouteId): Promise<void> {
    const parsedId = this.parseId(id);
    const existing = await this.repository.findById(parsedId);
    if (!existing) {
      throw new AppError('Student not found', 404);
    }
    await this.repository.delete(parsedId);
  }

  async list(query: ListStudentsQuery): Promise<PaginatedResponse<StudentDTO>> {
    const { page, pageSize, search, status } = query;
    const { items, total } = await this.repository.findMany({
      search,
      status,
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
