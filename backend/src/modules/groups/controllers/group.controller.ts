import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { GroupService } from '../services/group.service.js';
import type { GroupPaymentReportQuery, ListGroupsQuery } from '../validation/group.validation.js';

export class GroupController {
  constructor(private readonly service: GroupService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const group = await this.service.create(req.body, mustGetCenterId(req));
    res.status(201).json(group);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const group = await this.service.getById(req.params.id, mustGetCenterId(req));
    res.status(200).json(group);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const group = await this.service.update(req.params.id, mustGetCenterId(req), req.body);
    res.status(200).json(group);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, mustGetCenterId(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.list(req.query as unknown as ListGroupsQuery, req.centerId ?? null);
    res.status(200).json(result);
  };

  paymentReport = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.getPaymentReport(
      req.params.id,
      mustGetCenterId(req),
      req.query as unknown as GroupPaymentReportQuery,
    );
    res.status(200).json(result);
  };
}
