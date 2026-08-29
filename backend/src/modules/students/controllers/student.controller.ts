import type { Request, Response } from 'express';
import { mustGetCenterId } from '../../../shared/middleware/require-center-scope.js';
import type { StudentService } from '../services/student.service.js';
import type { ListStudentsQuery } from '../validation/student.validation.js';

export class StudentController {
  constructor(private readonly service: StudentService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const student = await this.service.create(req.body, mustGetCenterId(req));
    res.status(201).json(student);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const student = await this.service.getById(req.params.id, mustGetCenterId(req));
    res.status(200).json(student);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const student = await this.service.update(req.params.id, mustGetCenterId(req), req.body);
    res.status(200).json(student);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id, mustGetCenterId(req));
    res.status(204).send();
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.list(
      req.query as unknown as ListStudentsQuery,
      req.centerId ?? null,
    );
    res.status(200).json(result);
  };

  listGrades = async (req: Request, res: Response): Promise<void> => {
    const grades = await this.service.listGrades(req.centerId ?? null);
    res.status(200).json({ grades });
  };
}
