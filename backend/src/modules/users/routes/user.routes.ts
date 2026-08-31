import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import { requireCenterScope, requireResolvedCenterId } from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { UserController } from '../controllers/user.controller.js';
import { UserRepository } from '../repositories/user.repository.js';
import { UserService } from '../services/user.service.js';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from '../validation/user.validation.js';

const repository = new UserRepository();
const service = new UserService(repository);
const controller = new UserController(service);

const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', requirePermission('users', 'read'), validateQuery(listUsersQuerySchema), controller.list);
router.get('/:id', requirePermission('users', 'read'), requireResolvedCenterId, controller.getById);
router.post('/', requirePermission('users', 'create'), requireResolvedCenterId, validate(createUserSchema), controller.create);
router.patch(
  '/:id',
  requirePermission('users', 'update'),
  requireResolvedCenterId,
  validate(updateUserSchema),
  controller.update,
);
router.delete('/:id', requirePermission('users', 'delete'), requireResolvedCenterId, controller.delete);

export default router;
