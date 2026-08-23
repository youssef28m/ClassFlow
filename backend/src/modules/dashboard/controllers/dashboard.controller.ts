import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import type { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getOverview = async (req: Request, res: Response): Promise<void> => {
    res
      .status(200)
      .json(await this.service.getOverview(req.user as AuthUser, mustGetCenterId(req)));
  };
}
