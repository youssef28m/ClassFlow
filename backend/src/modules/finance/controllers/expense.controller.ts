import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { ExpenseService } from '../services/expense.service.js';
import type { ListExpensesQuery } from '../validation/expense.validation.js';

export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

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
    res.status(200).json(await this.service.list(req.query as unknown as ListExpensesQuery, req.centerId ?? null));
  };
}
