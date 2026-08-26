import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import {
  requireCenterScope,
  requireResolvedCenterId,
} from '../../../shared/middleware/require-center-scope.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { DashboardService } from '../services/dashboard.service.js';

const service = new DashboardService();
const controller = new DashboardController(service);

const router = Router();
router.use(authenticate, requireCenterScope);

router.get(
  '/',
  requirePermission('groupsAndSessions', 'read'),
  requireResolvedCenterId,
  controller.getOverview,
);

router.get(
  '/overdue',
  requirePermission('paymentsAndExpenses', 'read'),
  requireResolvedCenterId,
  controller.getOverdue,
);

export default router;
