import { Router } from 'express';
import { requireAnyPermission, requirePermission } from '../../../shared/authz/require-permission.js';
import { requireCenterScope, requireResolvedCenterId } from '../../../shared/middleware/require-center-scope.js';
import { validate, validateQuery } from '../../../shared/middleware/validate.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { ExpenseController } from '../controllers/expense.controller.js';
import { ExpenseRepository } from '../repositories/expense.repository.js';
import { ExpenseService } from '../services/expense.service.js';
import { createExpenseSchema, listExpensesQuerySchema, updateExpenseSchema } from '../validation/expense.validation.js';

const repository = new ExpenseRepository();
const service = new ExpenseService(repository);
const controller = new ExpenseController(service);

const router = Router();
router.use(authenticate, requireCenterScope);

router.get('/', requirePermission('paymentsAndExpenses', 'read'), validateQuery(listExpensesQuerySchema), controller.list);
router.get('/:id', requirePermission('paymentsAndExpenses', 'read'), requireResolvedCenterId, controller.getById);
router.post(
  '/',
  requireAnyPermission(
    { resource: 'paymentsAndExpenses', action: 'createExpense' },
    { resource: 'paymentsAndExpenses', action: 'manageExpenses' },
  ),
  requireResolvedCenterId,
  validate(createExpenseSchema),
  controller.create,
);
router.patch(
  '/:id',
  requirePermission('paymentsAndExpenses', 'manageExpenses'),
  requireResolvedCenterId,
  validate(updateExpenseSchema),
  controller.update,
);
router.delete('/:id', requirePermission('paymentsAndExpenses', 'manageExpenses'), requireResolvedCenterId, controller.delete);

export default router;
