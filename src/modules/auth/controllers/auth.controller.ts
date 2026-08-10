import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middleware/error-handler.js';
import type { AuthService } from '../services/auth.service.js';
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from '../services/cookie.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const pair = await this.service.login(req.body);
    setRefreshCookie(res, pair.refreshToken);
    res.status(200).json({ accessToken: pair.accessToken, user: pair.user });
  };

  signup = async (req: Request, res: Response): Promise<void> => {
    const pair = await this.service.signup(req.body);
    setRefreshCookie(res, pair.refreshToken);
    res.status(201).json({ accessToken: pair.accessToken, user: pair.user });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new AppError('Missing refresh token', 401);
    }
    const pair = await this.service.refresh(refreshToken);
    setRefreshCookie(res, pair.refreshToken);
    res.status(200).json({ accessToken: pair.accessToken, user: pair.user });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await this.service.logout(authUser.id, refreshToken);
    }
    clearRefreshCookie(res);
    res.status(204).send();
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    const authUser = req.user;
    if (!authUser) {
      throw new AppError('Unauthorized', 401);
    }
    await this.service.logoutAll(authUser.id);
    clearRefreshCookie(res);
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
