import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middleware/error-handler.js';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { AuthUser } from '../../auth/types/auth.types.js';
import type { UserService } from '../services/user.service.js';
import type { ListUsersQuery } from '../validation/user.validation.js';

export class UserController {
  constructor(private readonly service: UserService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.create(req.body, mustGetCenterId(req), this.getUser(req));
    res.status(201).json(user);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.getById(req.params.id, mustGetCenterId(req));
    res.status(200).json(user);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.update(req.params.id, mustGetCenterId(req), req.body, this.getUser(req));
    res.status(200).json(user);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, mustGetCenterId(req), this.getUser(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.list(req.query as unknown as ListUsersQuery, req.centerId ?? null);
    res.status(200).json(result);
  };

  private getUser(req: Request): AuthUser {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    return req.user;
  }
}
