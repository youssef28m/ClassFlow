import { Router } from 'express';
import { Role } from '../../../generated/prisma/client.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
import { StudentController } from '../controllers/student.controller.js';
import { StudentRepository } from '../repositories/student.repository.js';
import { StudentService } from '../services/student.service.js';
import {
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentSchema,
} from '../validation/student.validation.js';

const repository = new StudentRepository();
const service = new StudentService(repository);
const controller = new StudentController(service);

const WRITER_ROLES = [Role.SUPERADMIN, Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST];

const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', validateQuery(listStudentsQuerySchema), controller.list);
router.get('/:id', requireResolvedCenterId, controller.getById);
router.post(
  '/',
  authorize(...WRITER_ROLES),
  requireResolvedCenterId,
  validate(createStudentSchema),
  controller.create,
);
router.patch(
  '/:id',
  authorize(...WRITER_ROLES),
  requireResolvedCenterId,
  validate(updateStudentSchema),
  controller.update,
);
router.delete('/:id', authorize(...WRITER_ROLES), requireResolvedCenterId, controller.delete);

export default router;
