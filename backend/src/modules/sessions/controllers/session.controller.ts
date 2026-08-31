import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { SessionService } from '../services/session.service.js';
import type { AttendanceSummaryQuery, ListSessionsQuery } from '../validation/session.validation.js';

export class SessionController {
  constructor(private readonly service: SessionService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body, mustGetCenterId(req)));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.getById(req.params.id, mustGetCenterId(req)));
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.complete(req.params.id, mustGetCenterId(req)));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.id, mustGetCenterId(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.list(req.query as unknown as ListSessionsQuery, req.centerId ?? null));
  };

  listAttendance = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.listAttendance(req.params.id, mustGetCenterId(req)));
  };

  attendanceSummary = async (req: Request, res: Response): Promise<void> => {
    res
      .status(200)
      .json(await this.service.attendanceSummary(req.query as unknown as AttendanceSummaryQuery, mustGetCenterId(req)));
  };

  recordAttendance = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.recordAttendance(req.params.id, mustGetCenterId(req), req.body));
  };
}
