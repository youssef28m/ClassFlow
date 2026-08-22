import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { GroupController } from '../controllers/group.controller.js';
import { GroupRepository } from '../repositories/group.repository.js';
import { GroupService } from '../services/group.service.js';
import {
  createGroupSchema,
  listGroupsQuerySchema,
  updateGroupSchema,
} from '../validation/group.validation.js';

const repository = new GroupRepository();
const service = new GroupService(repository);
const controller = new GroupController(service);

const router = Router();

router.use(authenticate, requireCenterScope);

router.get('/', validateQuery(listGroupsQuerySchema), controller.list);
router.get('/:id', requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requirePermission('groupsAndSessions', 'manageGroups'),
  requireResolvedCenterId,
  validate(createGroupSchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('groupsAndSessions', 'manageGroups'),
  requireResolvedCenterId,
  validate(updateGroupSchema),
  controller.update,
);
router.delete(
  '/:id',
  requirePermission('groupsAndSessions', 'manageGroups'),
  requireResolvedCenterId,
  controller.delete,
);

export default router;
