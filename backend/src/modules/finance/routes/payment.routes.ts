import { Router } from 'express';
import { requireAnyPermission, requirePermission } from '../../../shared/authz/require-permission.js';
import { requireCenterScope, requireResolvedCenterId } from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { PaymentController } from '../controllers/payment.controller.js';
import { PaymentRepository } from '../repositories/payment.repository.js';
import { PaymentService } from '../services/payment.service.js';
import { createPaymentSchema, listPaymentsQuerySchema, updatePaymentSchema } from '../validation/payment.validation.js';

const repository = new PaymentRepository();
const service = new PaymentService(repository);
const controller = new PaymentController(service);

const router = Router();
router.use(authenticate, requireCenterScope);

router.get(
  '/summary/:studentId',
  requireAnyPermission(
    { resource: 'paymentsAndExpenses', action: 'read' },
    { resource: 'paymentsAndExpenses', action: 'logPayment' },
  ),
  requireResolvedCenterId,
  controller.studentSummary,
);
router.get('/', requirePermission('paymentsAndExpenses', 'read'), validateQuery(listPaymentsQuerySchema), controller.list);
router.get('/:id', requirePermission('paymentsAndExpenses', 'read'), requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requireAnyPermission(
    { resource: 'paymentsAndExpenses', action: 'logPayment' },
    { resource: 'paymentsAndExpenses', action: 'managePayments' },
  ),
  requireResolvedCenterId,
  validate(createPaymentSchema),
  controller.create,
);
router.patch(
  '/:id',
  requireAnyPermission(
    { resource: 'paymentsAndExpenses', action: 'logPayment' },
    { resource: 'paymentsAndExpenses', action: 'managePayments' },
  ),
  requireResolvedCenterId,
  validate(updatePaymentSchema),
  controller.update,
);
router.delete('/:id', requirePermission('paymentsAndExpenses', 'managePayments'), requireResolvedCenterId, controller.delete);

export default router;
