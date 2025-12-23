/**
 * Wage/Transaction Routes
 */
import { Router } from 'express';
import * as wageController from '../controllers/wage.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, employerOnly, govOrEmployer } from '../middleware/role.middleware.js';
import { validate, validateObjectId, validatePagination } from '../middleware/validation.middleware.js';
import { transactionLimiter } from '../middleware/rateLimit.middleware.js';
import {
  createTransactionValidator,
  transactionIdValidator,
  transactionQueryValidator,
  bulkTransactionValidator
} from '../validators/transaction.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

/**
 * @route POST /api/wages
 * @desc Create a wage payment
 * @access Private (Employer, Admin)
 */
router.post(
  '/',
  authenticate,
  authorize(ROLES.EMPLOYER, ROLES.ADMIN),
  transactionLimiter,
  createTransactionValidator,
  validate,
  wageController.createWagePayment
);

/**
 * @route GET /api/wages
 * @desc Get all transactions
 * @access Private
 */
router.get(
  '/',
  authenticate,
  transactionQueryValidator,
  validatePagination,
  wageController.getTransactions
);

/**
 * @route GET /api/wages/stats
 * @desc Get transaction statistics
 * @access Private (Employer, Government, Admin)
 */
router.get(
  '/stats',
  authenticate,
  govOrEmployer,
  wageController.getTransactionStats
);

/**
 * @route POST /api/wages/bulk
 * @desc Process bulk transactions
 * @access Private (Employer, Admin)
 */
router.post(
  '/bulk',
  authenticate,
  authorize(ROLES.EMPLOYER, ROLES.ADMIN),
  bulkTransactionValidator,
  validate,
  wageController.processBulkTransactions
);

/**
 * @route GET /api/wages/:id
 * @desc Get transaction by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  wageController.getTransactionById
);

/**
 * @route PUT /api/wages/:id/cancel
 * @desc Cancel a pending transaction
 * @access Private (Employer, Admin)
 */
router.put(
  '/:id/cancel',
  authenticate,
  authorize(ROLES.EMPLOYER, ROLES.ADMIN),
  validateObjectId('id'),
  wageController.cancelTransaction
);

export default router;
