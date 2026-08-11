import { Router } from 'express';
import { Role } from '../../../generated/prisma/client.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
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

const WRITER_ROLES = [Role.ADMIN, Role.MANAGER, Role.RECEPTIONIST];

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(listTeachersQuerySchema), controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize(...WRITER_ROLES), validate(createTeacherSchema), controller.create);
router.patch('/:id', authorize(...WRITER_ROLES), validate(updateTeacherSchema), controller.update);
router.delete('/:id', authorize(...WRITER_ROLES), controller.delete);

export default router;
