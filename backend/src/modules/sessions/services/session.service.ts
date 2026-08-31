import { DayOfWeek, Prisma } from '../../../generated/prisma/client.js';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AttendanceRepository } from '../repositories/attendance.repository.js';
import type { SessionRepository } from '../repositories/session.repository.js';
import type { AttendanceDTO, AttendanceSummaryEntryDTO, PaginatedResponse, SessionDTO } from '../types/session.types.js';
import { toAttendanceDTO, toSessionDTO } from '../types/session.types.js';
import type {
  AttendanceSummaryQuery,
  CreateSessionInput,
  ListSessionsQuery,
  RecordAttendanceInput,
} from '../validation/session.validation.js';

type RouteId = string | string[] | undefined;

const WEEKDAYS: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export class SessionService {
  constructor(
    private readonly repository: SessionRepository,
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async create(input: CreateSessionInput, centerId: number): Promise<SessionDTO> {
    const schedule = await this.repository.findScheduleInGroup(input.scheduleId, input.groupId, centerId);
    if (!schedule) throw new AppError('Schedule not found for this group', 400);
    if (WEEKDAYS[input.sessionDate.getUTCDay()] !== schedule.dayOfWeek) {
      throw new AppError('Session date does not match the schedule day', 400);
    }

    try {
      return toSessionDTO(await this.repository.create(input));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('A session already exists for this schedule and date', 409);
      }
      throw error;
    }
  }

  async getById(id: RouteId, centerId: number): Promise<SessionDTO> {
    const session = await this.repository.findById(this.parseId(id), centerId);
    if (!session) throw new AppError('Session not found', 404);
    return toSessionDTO(session);
  }

  async complete(id: RouteId, centerId: number): Promise<SessionDTO> {
    const session = await this.repository.complete(this.parseId(id), centerId);
    if (!session) throw new AppError('Session not found', 404);
    return toSessionDTO(session);
  }

  async remove(id: RouteId, centerId: number): Promise<void> {
    const deleted = await this.repository.delete(this.parseId(id), centerId);
    if (!deleted) throw new AppError('Session not found', 404);
  }

  async list(query: ListSessionsQuery, centerId: number | null): Promise<PaginatedResponse<SessionDTO>> {
    const { page, pageSize, groupId, scheduleId, completed, from, to } = query;
    if (from && to && from > to) throw new AppError('The from date must be before the to date', 400);
    const { items, total } = await this.repository.findMany({
      groupId,
      scheduleId,
      completed,
      from,
      to,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(toSessionDTO),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async listAttendance(sessionId: RouteId, centerId: number): Promise<AttendanceDTO[]> {
    const context = await this.getContext(sessionId, centerId);
    const records = await this.attendanceRepository.findBySession(context.id, centerId);
    return records.map(toAttendanceDTO);
  }

  async attendanceSummary(query: AttendanceSummaryQuery, centerId: number): Promise<AttendanceSummaryEntryDTO[]> {
    return this.attendanceRepository.summarizeForGroup(query.groupId, centerId);
  }

  async recordAttendance(sessionId: RouteId, centerId: number, input: RecordAttendanceInput): Promise<AttendanceDTO[]> {
    const context = await this.getContext(sessionId, centerId);
    const enrollmentIds = input.records.map((record) => record.enrollmentId);
    if (new Set(enrollmentIds).size !== enrollmentIds.length) {
      throw new AppError('Each enrollment can appear only once', 400);
    }

    const validIds = await this.attendanceRepository.findActiveEnrollmentIds(enrollmentIds, context.groupId);
    if (validIds.length !== enrollmentIds.length) {
      throw new AppError('All attendance records must belong to active enrollments in this group', 400);
    }

    const records = await this.attendanceRepository.replaceForSession(context.id, input.records);
    return records.map(toAttendanceDTO);
  }

  private async getContext(id: RouteId, centerId: number) {
    const context = await this.repository.findContext(this.parseId(id), centerId);
    if (!context) throw new AppError('Session not found', 404);
    return context;
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') throw new AppError('Invalid session id', 400);
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError('Invalid session id', 400);
    return parsed;
  }
}
