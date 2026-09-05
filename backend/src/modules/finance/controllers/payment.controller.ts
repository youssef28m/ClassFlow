import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import type { PaymentService } from '../services/payment.service.js';
import type { ListPaymentsQuery } from '../validation/payment.validation.js';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  studentSummary = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.studentSummary(req.params.studentId, mustGetCenterId(req), req.user as AuthUser));
  };

  availablePeriods = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.availablePeriods(req.params.enrollmentId, mustGetCenterId(req)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body, mustGetCenterId(req)));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.getById(req.params.id, mustGetCenterId(req)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.update(req.params.id, mustGetCenterId(req), req.body));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, mustGetCenterId(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.list(req.query as unknown as ListPaymentsQuery, req.centerId ?? null));
  };
}
