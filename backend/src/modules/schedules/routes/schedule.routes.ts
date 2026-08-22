import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { ScheduleController } from '../controllers/schedule.controller.js';
import { ScheduleRepository } from '../repositories/schedule.repository.js';
import { ScheduleService } from '../services/schedule.service.js';
import {
  createScheduleSchema,
  listSchedulesQuerySchema,
  updateScheduleSchema,
} from '../validation/schedule.validation.js';

const repository = new ScheduleRepository();
const service = new ScheduleService(repository);
const controller = new ScheduleController(service);

const router = Router();
router.use(authenticate, requireCenterScope);

router.get(
  '/',
  requirePermission('groupsAndSessions', 'read'),
  validateQuery(listSchedulesQuerySchema),
  controller.list,
);
router.get(
  '/:id',
  requirePermission('groupsAndSessions', 'read'),
  requireResolvedCenterId,
  controller.getById,
);
router.post(
  '/',
  requirePermission('groupsAndSessions', 'manageSchedules'),
  requireResolvedCenterId,
  validate(createScheduleSchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('groupsAndSessions', 'manageSchedules'),
  requireResolvedCenterId,
  validate(updateScheduleSchema),
  controller.update,
);
router.delete(
  '/:id',
  requirePermission('groupsAndSessions', 'manageSchedules'),
  requireResolvedCenterId,
  controller.delete,
);

export default router;
