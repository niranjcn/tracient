import { body, param, query } from 'express-validator';

export const createTransactionValidator = [
  // Accept either workerIdHash or workerID (for flexible frontend support)
  body('workerIdHash')
    .optional()
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid worker ID hash'),
  body('workerID')
    .optional()
    .notEmpty()
    .withMessage('Worker ID must not be empty'),
  // Ensure at least one worker identifier is provided
  body().custom((value, { req }) => {
    if (!req.body.workerIdHash && !req.body.workerID) {
      throw new Error('Either workerIdHash or workerID is required');
    }
    return true;
  }),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['upi', 'bank_transfer', 'cash', 'cheque'])
    .withMessage('Invalid payment method'),
  body('jobType')
    .optional()
    .isString()
    .withMessage('Job type must be a string'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('workPeriod.startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('workPeriod.endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('workPeriod.hoursWorked')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hours worked must be non-negative'),
  body('workPeriod.daysWorked')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Days worked must be non-negative')
];

export const upiPaymentValidator = [
  body('workerIdHash')
    .notEmpty()
    .withMessage('Worker ID hash is required'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1, max: 100000 })
    .withMessage('Amount must be between 1 and 100000'),
  body('senderName')
    .notEmpty()
    .withMessage('Sender name is required'),
  body('senderUPI')
    .optional()
    .matches(/^[\w.-]+@[\w]+$/)
    .withMessage('Invalid sender UPI ID')
];

export const transactionIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid transaction ID')
];

export const transactionQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative')
];

export const bulkTransactionValidator = [
  body('transactions')
    .isArray({ min: 1, max: 100 })
    .withMessage('Transactions must be an array with 1-100 items'),
  body('transactions.*.workerIdHash')
    .notEmpty()
    .withMessage('Worker ID hash is required'),
  body('transactions.*.amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0')
];

export const generateQRValidator = [
  body('workerIdHash')
    .notEmpty()
    .withMessage('Worker ID hash is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid worker ID hash'),
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('permanent')
    .optional()
    .isBoolean()
    .withMessage('Permanent must be a boolean'),
  body('expiresIn')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('Expiry must be between 60 and 86400 seconds')
];

export const scanQRValidator = [
  body('token')
    .notEmpty()
    .withMessage('QR token is required')
    .isString()
    .withMessage('Token must be a string')
];

export default {
  createTransactionValidator,
  upiPaymentValidator,
  transactionIdValidator,
  transactionQueryValidator,
  bulkTransactionValidator,
  generateQRValidator,
  scanQRValidator
};
