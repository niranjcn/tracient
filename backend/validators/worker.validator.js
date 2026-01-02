import { body, param, query } from 'express-validator';

export const createWorkerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('aadhaarNumber')
    .notEmpty()
    .withMessage('Aadhaar number is required')
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar number must be 12 digits'),
  body('bankAccount')
    .notEmpty()
    .withMessage('Bank account number is required')
    .matches(/^\d{9,18}$/)
    .withMessage('Invalid bank account number'),
  body('ifscCode')
    .optional()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('Invalid IFSC code'),
  body('upiId')
    .optional()
    .matches(/^[\w.-]+@[\w]+$/)
    .withMessage('Invalid UPI ID format'),
  body('address.pincode')
    .optional()
    .matches(/^\d{6}$/)
    .withMessage('Pincode must be 6 digits'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const dob = new Date(value);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      if (dob > minAge) {
        throw new Error('Worker must be at least 18 years old');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('employmentType')
    .optional()
    .isIn(['formal', 'informal'])
    .withMessage('Employment type must be either formal or informal'),
  body('isFarmer')
    .optional()
    .isBoolean()
    .withMessage('isFarmer must be a boolean value'),
  body('kccLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('KCC limit must be a positive number')
    .toFloat()
];

export const updateWorkerValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid worker ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  body('bankAccount')
    .optional()
    .matches(/^\d{9,18}$/)
    .withMessage('Invalid bank account number'),
  body('upiId')
    .optional()
    .matches(/^[\w.-]+@[\w]+$/)
    .withMessage('Invalid UPI ID format')
];

export const verifyWorkerValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid worker ID'),
  body('status')
    .isIn(['verified', 'rejected'])
    .withMessage('Status must be verified or rejected'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

export const workerIdHashValidator = [
  param('idHash')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid ID hash format')
    .isHexadecimal()
    .withMessage('ID hash must be hexadecimal')
];

export const workerQueryValidator = [
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
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('Invalid status'),
  query('category')
    .optional()
    .isIn(['BPL', 'APL'])
    .withMessage('Category must be BPL or APL')
];

export default {
  createWorkerValidator,
  updateWorkerValidator,
  verifyWorkerValidator,
  workerIdHashValidator,
  workerQueryValidator
};
