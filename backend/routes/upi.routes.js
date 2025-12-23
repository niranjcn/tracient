/**
 * UPI/QR Routes
 */
import { Router } from 'express';
import * as upiController from '../controllers/upi.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, employerOnly } from '../middleware/role.middleware.js';
import { validate, validateObjectId, validatePagination } from '../middleware/validation.middleware.js';
import { qrLimiter, transactionLimiter } from '../middleware/rateLimit.middleware.js';
import {
  generateQRValidator,
  scanQRValidator,
  upiPaymentValidator
} from '../validators/transaction.validator.js';
import { ROLES } from '../config/constants.js';

const router = Router();

/**
 * @route POST /api/upi/qr/generate
 * @desc Generate a QR code for payment (with selected bank account)
 * @access Private (Worker - for self, Employer/Admin - for worker)
 */
router.post(
  '/qr/generate',
  authenticate,
  authorize(ROLES.WORKER, ROLES.EMPLOYER, ROLES.ADMIN),
  qrLimiter,
  generateQRValidator,
  validate,
  upiController.generateQRCode
);

/**
 * @route POST /api/upi/qr/scan
 * @desc Validate scanned QR code
 * @access Private (Worker)
 */
router.post(
  '/qr/scan',
  authenticate,
  authorize(ROLES.WORKER),
  scanQRValidator,
  validate,
  upiController.scanQRCode
);

/**
 * @route POST /api/upi/pay
 * @desc Process UPI payment
 * @access Private (Employer, Admin)
 */
router.post(
  '/pay',
  authenticate,
  authorize(ROLES.EMPLOYER, ROLES.ADMIN),
  transactionLimiter,
  upiPaymentValidator,
  validate,
  upiController.processUPIPayment
);

/**
 * @route GET /api/upi/transactions
 * @desc Get UPI transactions
 * @access Private
 */
router.get(
  '/transactions',
  authenticate,
  validatePagination,
  upiController.getUPITransactions
);

/**
 * @route GET /api/upi/qr/active
 * @desc Get active QR tokens
 * @access Private (Employer, Admin)
 */
router.get(
  '/qr/active',
  authenticate,
  authorize(ROLES.EMPLOYER, ROLES.ADMIN),
  upiController.getActiveQRTokens
);

/**
 * @route GET /api/upi/transactions/:id
 * @desc Get UPI transaction by ID
 * @access Private
 */
router.get(
  '/transactions/:id',
  authenticate,
  validateObjectId('id'),
  upiController.getUPITransactionById
);

export default router;
