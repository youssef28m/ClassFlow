import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { EnrollmentService } from '../services/enrollment.service.js';
import type { ListEnrollmentsQuery } from '../validation/enrollment.validation.js';

export class EnrollmentController {
  constructor(private readonly service: EnrollmentService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const enrollment = await this.service.create(req.body, mustGetCenterId(req));
    res.status(201).json(enrollment);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const enrollment = await this.service.getById(req.params.id, mustGetCenterId(req));
    res.status(200).json(enrollment);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const enrollment = await this.service.updateStatus(
      req.params.id,
      mustGetCenterId(req),
      req.body,
    );
    res.status(200).json(enrollment);
  };

  updateDate = async (req: Request, res: Response): Promise<void> => {
    const enrollment = await this.service.updateDate(req.params.id, mustGetCenterId(req), req.body);
    res.status(200).json(enrollment);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, mustGetCenterId(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.list(
      req.query as unknown as ListEnrollmentsQuery,
      req.centerId ?? null,
    );
    res.status(200).json(result);
  };
}
