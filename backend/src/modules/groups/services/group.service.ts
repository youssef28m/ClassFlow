import { AppError } from '../../../shared/middleware/error-handler.js';
import type { GroupRepository } from '../repositories/group.repository.js';
import type { GroupDTO, PaginatedResponse } from '../types/group.types.js';
import { toGroupDTO } from '../types/group.types.js';
import type {
  CreateGroupInput,
  ListGroupsQuery,
  UpdateGroupInput,
} from '../validation/group.validation.js';

type RouteId = string | string[] | undefined;

export class GroupService {
  constructor(private readonly repository: GroupRepository) {}

  async create(input: CreateGroupInput, centerId: number): Promise<GroupDTO> {
    await this.ensureTeacherInCenter(input.teacherId, centerId);
    const group = await this.repository.create({ ...input, centerId });
    return toGroupDTO(group);
  }

  async getById(id: RouteId, centerId: number): Promise<GroupDTO> {
    const group = await this.repository.findById(this.parseId(id), centerId);
    if (!group) {
      throw new AppError('Group not found', 404);
    }
    return toGroupDTO(group);
  }

  async update(id: RouteId, centerId: number, input: UpdateGroupInput): Promise<GroupDTO> {
    const groupId = this.parseId(id);
    const currentGroup = await this.repository.findById(groupId, centerId);
    if (!currentGroup) {
      throw new AppError('Group not found', 404);
    }

    if (input.teacherId !== undefined) {
      await this.ensureTeacherInCenter(input.teacherId, centerId);
    }

    if (input.maxStudents !== undefined && input.maxStudents < currentGroup.maxStudents) {
      const activeEnrollmentCount = await this.repository.countActiveEnrollments(groupId);
      if (input.maxStudents < activeEnrollmentCount) {
        throw new AppError('Max students cannot be less than active enrollments', 400);
      }
    }

    const group = await this.repository.update(groupId, centerId, input);
    if (!group) {
      throw new AppError('Group not found', 404);
    }
    return toGroupDTO(group);
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    const deleted = await this.repository.delete(this.parseId(id), centerId);
    if (!deleted) {
      throw new AppError('Group not found', 404);
    }
  }

  async list(
    query: ListGroupsQuery,
    centerId: number | null,
  ): Promise<PaginatedResponse<GroupDTO>> {
    const { page, pageSize, search, teacherId, paymentType } = query;
    const { items, total } = await this.repository.findMany({
      search,
      teacherId,
      paymentType,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: items.map(toGroupDTO),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private async ensureTeacherInCenter(teacherId: number, centerId: number): Promise<void> {
    const exists = await this.repository.teacherExistsInCenter(teacherId, centerId);
    if (!exists) {
      throw new AppError('Teacher not found in this center', 400);
    }
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') {
      throw new AppError('Invalid group id', 400);
    }
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new AppError('Invalid group id', 400);
    }
    return parsed;
  }
}
