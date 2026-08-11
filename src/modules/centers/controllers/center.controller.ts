import type { Request, Response } from 'express';
import type { CenterService } from '../services/center.service.js';
import type { ListCentersQuery } from '../validation/center.validation.js';

export class CenterController {
  constructor(private readonly service: CenterService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const center = await this.service.create(req.body);
    res.status(201).json(center);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const center = await this.service.getById(req.params.id);
    res.status(200).json(center);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const center = await this.service.update(req.params.id, req.body);
    res.status(200).json(center);
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const center = await this.service.deactivate(req.params.id);
    res.status(200).json(center);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.list(req.query as unknown as ListCentersQuery);
    res.status(200).json(result);
  };

  registerUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.service.registerUser(req.params.id, req.body);
    res.status(201).json(user);
  };
}
