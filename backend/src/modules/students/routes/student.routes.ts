import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
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

const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', validateQuery(listStudentsQuerySchema), controller.list);
router.get('/grades', requireResolvedCenterId, controller.listGrades);
router.get('/:id', requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requirePermission('students', 'create'),
  requireResolvedCenterId,
  validate(createStudentSchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('students', 'update'),
  requireResolvedCenterId,
  validate(updateStudentSchema),
  controller.update,
);
router.delete(
  '/:id',
  requirePermission('students', 'delete'),
  requireResolvedCenterId,
  controller.delete,
);

export default router;
