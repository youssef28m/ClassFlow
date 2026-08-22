import { AppError } from '../../../shared/middleware/error-handler.js';
import type { PaymentRepository } from '../repositories/payment.repository.js';
import type { PaginatedResponse, PaymentDTO } from '../types/payment.types.js';
import { toPaymentDTO } from '../types/payment.types.js';
import type {
  CreatePaymentInput,
  ListPaymentsQuery,
  UpdatePaymentInput,
} from '../validation/payment.validation.js';

type RouteId = string | string[] | undefined;

export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async create(input: CreatePaymentInput, centerId: number): Promise<PaymentDTO> {
    await this.ensureEnrollment(input.enrollmentId, centerId);
    return toPaymentDTO(await this.repository.create(input));
  }

  async getById(id: RouteId, centerId: number): Promise<PaymentDTO> {
    const payment = await this.repository.findById(this.parseId(id), centerId);
    if (!payment) throw new AppError('Payment not found', 404);
    return toPaymentDTO(payment);
  }

  async update(id: RouteId, centerId: number, input: UpdatePaymentInput): Promise<PaymentDTO> {
    const payment = await this.repository.update(this.parseId(id), centerId, input);
    if (!payment) throw new AppError('Payment not found', 404);
    return toPaymentDTO(payment);
  }

  async delete(id: RouteId, centerId: number): Promise<void> {
    if (!(await this.repository.delete(this.parseId(id), centerId))) {
      throw new AppError('Payment not found', 404);
    }
  }

  async list(
    query: ListPaymentsQuery,
    centerId: number | null,
  ): Promise<PaginatedResponse<PaymentDTO>> {
    const { page, pageSize, enrollmentId, paymentMethod, from, to } = query;
    if (from && to && from > to)
      throw new AppError('The from date must be before the to date', 400);
    const { items, total } = await this.repository.findMany({
      enrollmentId,
      paymentMethod,
      from,
      to,
      centerId,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: items.map(toPaymentDTO),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  private async ensureEnrollment(enrollmentId: number, centerId: number): Promise<void> {
    if (!(await this.repository.findActiveEnrollmentInCenter(enrollmentId, centerId))) {
      throw new AppError('Active enrollment not found in this center', 400);
    }
  }

  private parseId(id: RouteId): number {
    if (typeof id !== 'string') throw new AppError('Invalid payment id', 400);
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) throw new AppError('Invalid payment id', 400);
    return parsed;
  }
}
