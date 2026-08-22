import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { SalaryController } from '../controllers/salary.controller.js';
import { SalaryRepository } from '../repositories/salary.repository.js';
import { SalaryService } from '../services/salary.service.js';
import {
  createSalarySchema,
  listSalariesQuerySchema,
  updateSalarySchema,
} from '../validation/salary.validation.js';

const repository = new SalaryRepository();
const service = new SalaryService(repository);
const controller = new SalaryController(service);

const router = Router();
router.use(authenticate, requireCenterScope);

router.get(
  '/',
  requirePermission('teachersAndSalaries', 'manageSalaries'),
  validateQuery(listSalariesQuerySchema),
  controller.list,
);
router.get(
  '/:id',
  requirePermission('teachersAndSalaries', 'manageSalaries'),
  requireResolvedCenterId,
  controller.getById,
);
router.post(
  '/',
  requirePermission('teachersAndSalaries', 'manageSalaries'),
  requireResolvedCenterId,
  validate(createSalarySchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('teachersAndSalaries', 'manageSalaries'),
  requireResolvedCenterId,
  validate(updateSalarySchema),
  controller.update,
);
router.delete(
  '/:id',
  requirePermission('teachersAndSalaries', 'manageSalaries'),
  requireResolvedCenterId,
  controller.delete,
);

export default router;
