import { Router } from 'express';
import {
  loginLimiter,
  refreshLimiter,
  signupLimiter,
} from '../../../shared/middleware/rate-limit.js';
import { validate } from '../../../shared/middleware/validate.js';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import { loginSchema, signupSchema } from '../validation/auth.validation.js';

const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/signup', signupLimiter, validate(signupSchema), controller.signup);
router.post('/refresh', refreshLimiter, controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);
router.get('/me', authenticate, controller.me);

export default router;
