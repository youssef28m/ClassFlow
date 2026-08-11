import { AppError } from '../../../shared/middleware/error-handler.js';
import type { TeacherRepository } from '../repositories/teacher.repository.js';
import type { PaginatedResponse, TeacherDTO } from '../types/teacher.types.js';
import { toTeacherDTO } from '../types/teacher.types.js';
import type {
  CreateTeacherInput,
  ListTeachersQuery,
  UpdateTeacherInput,
} from '../validation/teacher.validation.js';

type RouteId = string | string[] | undefined;

export class TeacherService {
  constructor(private readonly repository: TeacherRepository) {}

  async create(input: CreateTeacherInput): Promise<TeacherDTO> {
    const teacher = await this.repository.create(input);
    return toTeacherDTO(teacher);
  }

  async getById(id: RouteId): Promise<TeacherDTO> {
    const teacher = await this.repository.findById(this.parseId(id));
    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }
    return toTeacherDTO(teacher);
  }

  async update(id: RouteId, input: UpdateTeacherInput): Promise<TeacherDTO> {
    const parsedId = this.parseId(id);
    const existing = await this.repository.findById(parsedId);
    if (!existing) {
      throw new AppError('Teacher not found', 404);
    }
    const teacher = await this.repository.update(parsedId, input);
    return toTeacherDTO(teacher);
  }

  async delete(id: RouteId): Promise<void> {
    const parsedId = this.parseId(id);
    const existing = await this.repository.findById(parsedId);
    if (!existing) {
      throw new AppError('Teacher not found', 404);
    }
    await this.repository.delete(parsedId);
  }

  async list(query: ListTeachersQuery): Promise<PaginatedResponse<TeacherDTO>> {
    const { page, pageSize, search, active } = query;
    const { items, total } = await this.repository.findMany({
      search,
      active,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(toTeacherDTO),
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
      throw new AppError('Invalid teacher id', 400);
    }
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid teacher id', 400);
    }
    return parsed;
  }
}
