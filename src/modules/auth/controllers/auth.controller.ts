import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthService } from '../services/auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.login(req.body);
    res.status(200).json(result);
  };

  signup = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.signup(req.body);
    res.status(201).json(result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.refresh(req.body.refreshToken);
    res.status(200).json(result);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }
    await this.service.logout(authUser.id, req.body.refreshToken);
    res.status(204).send();
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }
    await this.service.logoutAll(authUser.id);
    res.status(204).send();
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }
    const user = await this.service.getCurrentUser(authUser.id);
    res.status(200).json({ user });
  };
}
