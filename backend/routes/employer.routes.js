/**
 * Employer Routes
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize, adminOnly, govOrAdmin, employerOnly } from '../middleware/role.middleware.js';
import { validate, validateObjectId, validatePagination } from '../middleware/validation.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { successResponse, paginatedResponse, errorResponse, notFoundResponse } from '../utils/response.util.js';
import { paginateQuery } from '../utils/pagination.util.js';
import { body, query, param } from 'express-validator';
import { ROLES, VERIFICATION_STATUS } from '../config/constants.js';
import { Employer, User, Worker, WageRecord } from '../models/index.js';
import { auditLog, logger } from '../utils/logger.util.js';

const router = Router();

/**
 * @route GET /api/employers/profile
 * @desc Get current employer's profile
 * @access Private (Employer)
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findOne({ userId: req.user.id })
      .populate('userId', 'email role isActive lastLogin');
    
    if (!employer) {
      return notFoundResponse(res, 'Employer profile not found');
    }
    
    return successResponse(res, { employer });
  })
);

/**
 * @route PUT /api/employers/profile
 * @desc Update current employer's profile
 * @access Private (Employer)
 */
router.put(
  '/profile',
  authenticate,
  [
    body('companyName').optional().trim().notEmpty(),
    body('businessType').optional().trim(),
    body('gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    body('address').optional().isObject(),
    body('contactPerson').optional().trim()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findOne({ userId: req.user.id });
    
    if (!employer) {
      return notFoundResponse(res, 'Employer profile not found');
    }
    
    const { companyName, businessType, gstin, address, contactPerson, phone, website } = req.body;
    
    if (companyName) employer.companyName = companyName;
    if (businessType) employer.businessType = businessType;
    if (gstin) employer.gstin = gstin;
    if (address) employer.address = address;
    if (contactPerson) employer.contactPerson = contactPerson;
    if (phone) employer.phone = phone;
    if (website) employer.website = website;
    
    await employer.save();
    
    logger.info('Employer profile updated', { employerId: employer._id });
    
    return successResponse(res, { employer }, 'Profile updated successfully');
  })
);

/**
 * @route GET /api/employers/profile/payments
 * @desc Get current employer's payment summary
 * @access Private (Employer)
 */
router.get(
  '/profile/payments',
  authenticate,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findOne({ userId: req.user.id });
    
    if (!employer) {
      return notFoundResponse(res, 'Employer profile not found');
    }
    
    // Get wage records
    const wageRecords = await WageRecord.find({
      employerId: employer._id,
      status: 'completed'
    }).sort({ createdAt: -1 });
    
    const totalPaid = wageRecords.reduce((sum, w) => sum + w.amount, 0);
    
    // Get unique workers paid
    const workerIds = [...new Set(wageRecords.map(w => w.workerId.toString()))];
    const workerCount = workerIds.length;
    
    const transactionCount = wageRecords.length;
    const avgWage = transactionCount > 0 ? Math.round(totalPaid / transactionCount) : 0;
    
    // Last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = wageRecords
      .filter(w => new Date(w.createdAt) >= thirtyDaysAgo)
      .reduce((sum, w) => sum + w.amount, 0);
    
    return successResponse(res, {
      totalPaid,
      workerCount,
      transactionCount,
      avgWage,
      last30Days,
      lastUpdated: new Date()
    });
  })
);

/**
 * @route GET /api/employers/profile/workers
 * @desc Get workers paid by current employer
 * @access Private (Employer)
 */
router.get(
  '/profile/workers',
  authenticate,
  validatePagination,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findOne({ userId: req.user.id });
    
    if (!employer) {
      return notFoundResponse(res, 'Employer profile not found');
    }
    
    // Get unique workers this employer has paid
    const wageRecords = await WageRecord.find({ employerId: employer._id })
      .populate('workerId', 'name phone idHash maskedAadhaar')
      .sort({ createdAt: -1 });
    
    // Group by worker
    const workerMap = new Map();
    wageRecords.forEach(record => {
      if (record.workerId) {
        const workerId = record.workerId._id.toString();
        if (!workerMap.has(workerId)) {
          workerMap.set(workerId, {
            worker: record.workerId,
            totalPaid: 0,
            transactionCount: 0,
            lastPayment: record.createdAt
          });
        }
        const entry = workerMap.get(workerId);
        entry.totalPaid += record.amount;
        entry.transactionCount += 1;
      }
    });
    
    const workers = Array.from(workerMap.values());
    
    return successResponse(res, { workers, count: workers.length });
  })
);

/**
 * @route GET /api/employers
 * @desc Get all employers
 * @access Private (Admin, Government)
 */
router.get(
  '/',
  authenticate,
  govOrAdmin,
  validatePagination,
  asyncHandler(async (req, res) => {
    const { query: searchQuery, status, verified } = req.query;
    const filter = {};

    if (searchQuery) {
      filter.$or = [
        { companyName: { $regex: searchQuery, $options: 'i' } },
        { businessType: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    if (status) filter.verificationStatus = status;
    if (verified !== undefined) filter.isVerified = verified === 'true';

    const { data, pagination } = await paginateQuery(Employer, filter, req.query, {
      populate: { path: 'user', select: 'email createdAt lastLogin' },
      defaultSort: '-createdAt'
    });

    return paginatedResponse(res, data, pagination, 'Employers retrieved');
  })
);

/**
 * @route GET /api/employers/:id
 * @desc Get employer by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  validateObjectId('id'),
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id)
      .populate('user', 'email createdAt lastLogin');

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    // Only admin/gov or the employer themselves can view full details
    if (req.user.role !== ROLES.ADMIN && 
        req.user.role !== ROLES.GOVERNMENT && 
        employer.user._id.toString() !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    return successResponse(res, { employer }, 'Employer retrieved');
  })
);

/**
 * @route PUT /api/employers/:id
 * @desc Update employer profile
 * @access Private (Owner, Admin)
 */
router.put(
  '/:id',
  authenticate,
  validateObjectId('id'),
  [
    body('companyName').optional().trim().notEmpty(),
    body('businessType').optional().trim(),
    body('gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    body('address').optional().isObject(),
    body('contactPerson').optional().isObject()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    // Only admin or the employer themselves can update
    if (req.user.role !== ROLES.ADMIN && employer.user.toString() !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    const allowedUpdates = ['companyName', 'businessType', 'gstin', 'address', 'contactPerson'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(employer, updates);
    await employer.save();

    await auditLog({
      action: 'employer.update',
      userId: req.user.id,
      targetType: 'Employer',
      targetId: employer._id,
      details: { updates: Object.keys(updates) }
    });

    return successResponse(res, { employer }, 'Employer updated');
  })
);

/**
 * @route GET /api/employers/:id/workers
 * @desc Get workers of an employer
 * @access Private (Owner, Admin, Government)
 */
router.get(
  '/:id/workers',
  authenticate,
  validateObjectId('id'),
  validatePagination,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    // Only admin, gov, or the employer themselves can view workers
    if (req.user.role !== ROLES.ADMIN && 
        req.user.role !== ROLES.GOVERNMENT && 
        employer.user.toString() !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    const filter = { currentEmployer: employer._id };
    
    const { data, pagination } = await paginateQuery(Worker, filter, req.query, {
      populate: { path: 'user', select: 'email' },
      defaultSort: '-employment.startDate'
    });

    return paginatedResponse(res, data, pagination, 'Workers retrieved');
  })
);

/**
 * @route GET /api/employers/:id/transactions
 * @desc Get transactions of an employer
 * @access Private (Owner, Admin, Government)
 */
router.get(
  '/:id/transactions',
  authenticate,
  validateObjectId('id'),
  validatePagination,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    if (req.user.role !== ROLES.ADMIN && 
        req.user.role !== ROLES.GOVERNMENT && 
        employer.user.toString() !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    const filter = { employer: employer._id };
    
    if (req.query.startDate || req.query.endDate) {
      filter.paymentDate = {};
      if (req.query.startDate) filter.paymentDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.paymentDate.$lte = new Date(req.query.endDate);
    }

    const { data, pagination } = await paginateQuery(WageRecord, filter, req.query, {
      populate: [
        { path: 'worker', select: 'name idHash' }
      ],
      defaultSort: '-paymentDate'
    });

    return paginatedResponse(res, data, pagination, 'Transactions retrieved');
  })
);

/**
 * @route GET /api/employers/:id/stats
 * @desc Get employer statistics
 * @access Private (Owner, Admin, Government)
 */
router.get(
  '/:id/stats',
  authenticate,
  validateObjectId('id'),
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    if (req.user.role !== ROLES.ADMIN && 
        req.user.role !== ROLES.GOVERNMENT && 
        employer.user.toString() !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    // Get statistics
    const [workerCount, transactionStats] = await Promise.all([
      Worker.countDocuments({ currentEmployer: employer._id }),
      WageRecord.aggregate([
        { $match: { employer: employer._id } },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            completedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const stats = {
      workerCount,
      totalTransactions: transactionStats[0]?.totalTransactions || 0,
      totalAmountPaid: transactionStats[0]?.totalAmount || 0,
      averageTransaction: transactionStats[0]?.avgAmount || 0,
      completedTransactions: transactionStats[0]?.completedCount || 0,
      ...employer.statistics
    };

    return successResponse(res, { stats }, 'Employer statistics retrieved');
  })
);

/**
 * @route PUT /api/employers/:id/verify
 * @desc Verify an employer
 * @access Private (Government, Admin)
 */
router.put(
  '/:id/verify',
  authenticate,
  govOrAdmin,
  validateObjectId('id'),
  [
    body('status').isIn(['verified', 'rejected']).withMessage('Invalid status'),
    body('remarks').optional().isString()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    const { status, remarks } = req.body;

    employer.verificationStatus = status;
    employer.isVerified = status === 'verified';
    employer.verification = {
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      remarks
    };

    await employer.save();

    await auditLog({
      action: 'employer.verify',
      userId: req.user.id,
      targetType: 'Employer',
      targetId: employer._id,
      details: { status, remarks }
    });

    return successResponse(res, { employer }, `Employer ${status}`);
  })
);

/**
 * @route DELETE /api/employers/:id
 * @desc Delete/deactivate an employer
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  authenticate,
  adminOnly,
  validateObjectId('id'),
  asyncHandler(async (req, res) => {
    const employer = await Employer.findById(req.params.id);
    
    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    // Soft delete - deactivate the user account
    await User.findByIdAndUpdate(employer.user, { isActive: false });

    await auditLog({
      action: 'employer.delete',
      userId: req.user.id,
      targetType: 'Employer',
      targetId: employer._id,
      details: { deactivated: true }
    });

    return successResponse(res, null, 'Employer deactivated');
  })
);

export default router;
