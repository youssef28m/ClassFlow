import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { TeacherService } from '../services/teacher.service.js';
import type { ListTeachersQuery } from '../validation/teacher.validation.js';

export class TeacherController {
  constructor(private readonly service: TeacherService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const teacher = await this.service.create(req.body, mustGetCenterId(req));
    res.status(201).json(teacher);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const teacher = await this.service.getById(req.params.id, mustGetCenterId(req));
    res.status(200).json(teacher);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const teacher = await this.service.update(req.params.id, mustGetCenterId(req), req.body);
    res.status(200).json(teacher);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, mustGetCenterId(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.list(
      req.query as unknown as ListTeachersQuery,
      req.centerId ?? null,
    );
    res.status(200).json(result);
  };
}
