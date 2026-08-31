import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { SalaryService } from '../services/salary.service.js';
import type { CalculateSalaryInput, ListSalariesQuery } from '../validation/salary.validation.js';

export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  calculate = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.calculate(req.query as unknown as CalculateSalaryInput, mustGetCenterId(req)));
  };

  pay = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.pay(req.body, mustGetCenterId(req)));
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
    res.status(200).json(await this.service.list(req.query as unknown as ListSalariesQuery, req.centerId ?? null));
  };

  report = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.getReport(req.params.id, mustGetCenterId(req)));
  };
}
