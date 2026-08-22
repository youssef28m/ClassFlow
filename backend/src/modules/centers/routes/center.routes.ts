import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import { requireCenterScope } from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { AuthRepository } from '../../auth/repositories/auth.repository.js';
import { CenterController } from '../controllers/center.controller.js';
import { CenterRepository } from '../repositories/center.repository.js';
import { CenterService } from '../services/center.service.js';
import {
  createCenterSchema,
  createCenterUserSchema,
  listCentersQuerySchema,
  updateCenterSchema,
} from '../validation/center.validation.js';

const repository = new CenterRepository();
const authRepository = new AuthRepository();
const service = new CenterService(repository, authRepository);
const controller = new CenterController(service);

const router = Router();

router.use(authenticate, requireCenterScope);

// Reads: SUPERADMIN (all), ADMIN/MANAGER (own center — scoped in service).
router.get('/', validateQuery(listCentersQuerySchema), controller.list);
router.get('/:id', controller.getById);

// Writes: matrix grants create/update/delete on centers to SUPERADMIN only.
router.post(
  '/',
  requirePermission('centers', 'create'),
  validate(createCenterSchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('centers', 'update'),
  validate(updateCenterSchema),
  controller.update,
);
router.patch('/:id/deactivate', requirePermission('centers', 'update'), controller.deactivate);
// Registering users is a `users` action, not a center action.
router.post(
  '/:id/users',
  requirePermission('users', 'create'),
  validate(createCenterUserSchema),
  controller.registerUser,
);

export default router;
