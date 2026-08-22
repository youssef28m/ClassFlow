import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { TeacherController } from '../controllers/teacher.controller.js';
import { TeacherRepository } from '../repositories/teacher.repository.js';
import { TeacherService } from '../services/teacher.service.js';
import {
  createTeacherSchema,
  listTeachersQuerySchema,
  updateTeacherSchema,
} from '../validation/teacher.validation.js';

const repository = new TeacherRepository();
const service = new TeacherService(repository);
const controller = new TeacherController(service);

const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', validateQuery(listTeachersQuerySchema), controller.list);
router.get('/:id', requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requirePermission('teachersAndSalaries', 'createTeacher'),
  requireResolvedCenterId,
  validate(createTeacherSchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('teachersAndSalaries', 'updateTeacher'),
  requireResolvedCenterId,
  validate(updateTeacherSchema),
  controller.update,
);
router.delete(
  '/:id',
  requirePermission('teachersAndSalaries', 'deleteTeacher'),
  requireResolvedCenterId,
  controller.delete,
);

export default router;
