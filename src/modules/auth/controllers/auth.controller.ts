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

  me = async (req: Request, res: Response): Promise<void> => {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }
    const user = await this.service.getCurrentUser(authUser.id);
    res.status(200).json({ user });
  };
}
