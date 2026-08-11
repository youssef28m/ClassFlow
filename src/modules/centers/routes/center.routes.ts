import { Router } from 'express';
import { Role } from '../../../generated/prisma/client.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
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

router.use(authenticate, authorize(Role.SUPERADMIN));

router.get('/', validateQuery(listCentersQuerySchema), controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createCenterSchema), controller.create);
router.patch('/:id', validate(updateCenterSchema), controller.update);
router.patch('/:id/deactivate', controller.deactivate);
router.post('/:id/users', validate(createCenterUserSchema), controller.registerUser);

export default router;
