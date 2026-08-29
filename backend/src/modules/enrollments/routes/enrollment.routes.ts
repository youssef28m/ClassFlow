import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { EnrollmentController } from '../controllers/enrollment.controller.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { EnrollmentService } from '../services/enrollment.service.js';
import {
  createEnrollmentSchema,
  listEnrollmentsQuerySchema,
  updateEnrollmentDateSchema,
  updateEnrollmentStatusSchema,
} from '../validation/enrollment.validation.js';

const repository = new EnrollmentRepository();
const service = new EnrollmentService(repository);
const controller = new EnrollmentController(service);

// Enrollments are enforced against the `students` resource per the matrix
// ruling: they are part of the student lifecycle and inherit its permissions.
const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', validateQuery(listEnrollmentsQuerySchema), controller.list);
router.get('/:id', requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requirePermission('students', 'create'),
  requireResolvedCenterId,
  validate(createEnrollmentSchema),
  controller.create,
);
router.patch(
  '/:id/status',
  requirePermission('students', 'update'),
  requireResolvedCenterId,
  validate(updateEnrollmentStatusSchema),
  controller.updateStatus,
);
router.patch(
  '/:id/date',
  requirePermission('students', 'update'),
  requireResolvedCenterId,
  validate(updateEnrollmentDateSchema),
  controller.updateDate,
);
router.delete(
  '/:id',
  requirePermission('students', 'delete'),
  requireResolvedCenterId,
  controller.delete,
);

export default router;
