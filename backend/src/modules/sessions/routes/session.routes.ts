import { Router } from 'express';
import { requirePermission } from '../../../shared/authz/require-permission.js';
import { requireCenterScope, requireResolvedCenterId } from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { SessionController } from '../controllers/session.controller.js';
import { AttendanceRepository } from '../repositories/attendance.repository.js';
import { SessionRepository } from '../repositories/session.repository.js';
import { SessionService } from '../services/session.service.js';
import {
  attendanceSummaryQuerySchema,
  createSessionSchema,
  listSessionsQuerySchema,
  recordAttendanceSchema,
} from '../validation/session.validation.js';

const repository = new SessionRepository();
const attendanceRepository = new AttendanceRepository();
const service = new SessionService(repository, attendanceRepository);
const controller = new SessionController(service);

const router = Router();
router.use(authenticate, requireCenterScope);

router.get(
  '/attendance-summary',
  requirePermission('groupsAndSessions', 'read'),
  requireResolvedCenterId,
  validateQuery(attendanceSummaryQuerySchema),
  controller.attendanceSummary,
);
router.get('/', requirePermission('groupsAndSessions', 'read'), validateQuery(listSessionsQuerySchema), controller.list);
router.get('/:id', requirePermission('groupsAndSessions', 'read'), requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requirePermission('groupsAndSessions', 'manageSessions'),
  requireResolvedCenterId,
  validate(createSessionSchema),
  controller.create,
);
router.patch(
  '/:id/complete',
  requirePermission('groupsAndSessions', 'manageSessions'),
  requireResolvedCenterId,
  controller.complete,
);
router.delete('/:id', requirePermission('groupsAndSessions', 'manageSessions'), requireResolvedCenterId, controller.delete);
router.get('/:id/attendance', requirePermission('groupsAndSessions', 'read'), requireResolvedCenterId, controller.listAttendance);
router.put(
  '/:id/attendance',
  requirePermission('groupsAndSessions', 'markAttendance'),
  requireResolvedCenterId,
  validate(recordAttendanceSchema),
  controller.recordAttendance,
);

export default router;
