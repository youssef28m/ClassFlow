import { Router } from 'express';
import { Role } from '../../../generated/prisma/client.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
import { EnrollmentController } from '../controllers/enrollment.controller.js';
import { EnrollmentRepository } from '../repositories/enrollment.repository.js';
import { EnrollmentService } from '../services/enrollment.service.js';
import {
  createEnrollmentSchema,
  listEnrollmentsQuerySchema,
  updateEnrollmentStatusSchema,
} from '../validation/enrollment.validation.js';

const repository = new EnrollmentRepository();
const service = new EnrollmentService(repository);
const controller = new EnrollmentController(service);

const WRITER_ROLES = [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST];

const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', validateQuery(listEnrollmentsQuerySchema), controller.list);
router.get('/:id', requireResolvedCenterId, controller.getById);
router.post(
  '/',
  authorize(...WRITER_ROLES),
  requireResolvedCenterId,
  validate(createEnrollmentSchema),
  controller.create,
);
router.patch(
  '/:id/status',
  authorize(...WRITER_ROLES),
  requireResolvedCenterId,
  validate(updateEnrollmentStatusSchema),
  controller.updateStatus,
);
router.delete('/:id', authorize(...WRITER_ROLES), requireResolvedCenterId, controller.delete);

export default router;
