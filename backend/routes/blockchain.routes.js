/**
 * Blockchain Routes
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { govOrAdmin } from '../middleware/role.middleware.js';
import { validate, validateObjectId } from '../middleware/validation.middleware.js';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { successResponse } from '../utils/response.util.js';
import { body, query } from 'express-validator';
import fabricService from '../services/fabric.service.js';
import { WageRecord, Worker } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = Router();

/**
 * @route GET /api/blockchain/status
 * @desc Get blockchain network status
 * @access Private
 */
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const status = await fabricService.getNetworkStatus();
    return successResponse(res, { status }, 'Blockchain status retrieved');
  })
);

/**
 * @route GET /api/blockchain/transaction/:transactionId
 * @desc Get transaction details from blockchain
 * @access Private
 */
router.get(
  '/transaction/:transactionId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { transactionId } = req.params;
    
    // First check if we have a local record
    const localRecord = await WageRecord.findOne({ 
      $or: [
        { 'blockchain.transactionId': transactionId },
        { _id: transactionId }
      ]
    });

    if (!localRecord) {
      throw new AppError('Transaction not found', 404);
    }

    // Get blockchain verification
    let blockchainData = null;
    try {
      blockchainData = await fabricService.verifyTransaction(
        localRecord.blockchain?.transactionId || transactionId
      );
    } catch (error) {
      blockchainData = { verified: false, error: error.message };
    }

    return successResponse(res, {
      localRecord: {
        id: localRecord._id,
        amount: localRecord.amount,
        status: localRecord.status,
        paymentDate: localRecord.paymentDate,
        blockchain: localRecord.blockchain
      },
      blockchainData
    }, 'Transaction retrieved');
  })
);

/**
 * @route GET /api/blockchain/worker/:idHash/history
 * @desc Get worker's wage history from blockchain
 * @access Private
 */
router.get(
  '/worker/:idHash/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const { idHash } = req.params;
    const { startDate, endDate } = req.query;

    // Authorization: only the worker themselves, their employer, gov, or admin
    const worker = await Worker.findOne({ idHash });
    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    if (req.user.role === ROLES.WORKER && worker.user.toString() !== req.user.id) {
      throw new AppError('Unauthorized', 403);
    }

    // Get history from blockchain
    let blockchainHistory = [];
    try {
      blockchainHistory = await fabricService.getWorkerWageHistory(idHash, startDate, endDate);
    } catch (error) {
      // Fallback to local database
      const filter = { worker: worker._id };
      if (startDate || endDate) {
        filter.paymentDate = {};
        if (startDate) filter.paymentDate.$gte = new Date(startDate);
        if (endDate) filter.paymentDate.$lte = new Date(endDate);
      }
      
      const localHistory = await WageRecord.find(filter)
        .sort({ paymentDate: -1 })
        .limit(100)
        .lean();
      
      blockchainHistory = localHistory.map(tx => ({
        ...tx,
        source: 'local_database',
        blockchainVerified: false
      }));
    }

    return successResponse(res, { 
      idHash,
      history: blockchainHistory,
      count: blockchainHistory.length
    }, 'Worker history retrieved');
  })
);

/**
 * @route POST /api/blockchain/verify
 * @desc Verify a transaction on blockchain
 * @access Private
 */
router.post(
  '/verify',
  authenticate,
  [
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
    body('transactionHash').optional().isString()
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { transactionId, transactionHash } = req.body;

    const record = await WageRecord.findById(transactionId);
    if (!record) {
      throw new AppError('Transaction not found', 404);
    }

    let verificationResult;
    try {
      verificationResult = await fabricService.verifyTransaction(
        record.blockchain?.transactionId,
        transactionHash || record.transactionHash
      );
    } catch (error) {
      verificationResult = {
        verified: false,
        error: error.message,
        localRecord: {
          status: record.status,
          blockchain: record.blockchain
        }
      };
    }

    return successResponse(res, { verificationResult }, 'Verification complete');
  })
);

/**
 * @route GET /api/blockchain/worker/:idHash/classification
 * @desc Get worker's BPL classification from blockchain
 * @access Private (Government, Admin)
 */
router.get(
  '/worker/:idHash/classification',
  authenticate,
  govOrAdmin,
  asyncHandler(async (req, res) => {
    const { idHash } = req.params;

    const worker = await Worker.findOne({ idHash });
    if (!worker) {
      throw new AppError('Worker not found', 404);
    }

    let blockchainClassification;
    try {
      blockchainClassification = await fabricService.evaluateTransaction(
        'GetWorkerClassification',
        idHash
      );
    } catch (error) {
      // Fallback to local data
      blockchainClassification = {
        source: 'local_database',
        ...worker.bplClassification
      };
    }

    return successResponse(res, {
      idHash,
      classification: blockchainClassification,
      localData: worker.bplClassification
    }, 'Classification retrieved');
  })
);

/**
 * @route POST /api/blockchain/sync
 * @desc Sync local records with blockchain (admin only)
 * @access Private (Admin)
 */
router.post(
  '/sync',
  authenticate,
  govOrAdmin,
  asyncHandler(async (req, res) => {
    const { limit = 100 } = req.body;

    // Find records that haven't been synced to blockchain
    const unsyncedRecords = await WageRecord.find({
      status: 'completed',
      'blockchain.recordedOnChain': { $ne: true }
    })
      .limit(limit)
      .populate('worker', 'idHash')
      .lean();

    const results = {
      total: unsyncedRecords.length,
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const record of unsyncedRecords) {
      try {
        const blockchainResult = await fabricService.recordWagePayment({
          idHash: record.worker.idHash,
          transactionId: record._id.toString(),
          amount: record.amount,
          paymentDate: record.paymentDate,
          paymentMethod: record.paymentMethod
        });

        if (blockchainResult.success) {
          await WageRecord.findByIdAndUpdate(record._id, {
            'blockchain.recordedOnChain': true,
            'blockchain.transactionId': blockchainResult.transactionId,
            'blockchain.timestamp': new Date()
          });
          results.synced++;
        } else {
          results.failed++;
          results.errors.push({ id: record._id, error: blockchainResult.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: record._id, error: error.message });
      }
    }

    return successResponse(res, { results }, 'Sync operation completed');
  })
);

/**
 * @route GET /api/blockchain/analytics
 * @desc Get blockchain analytics
 * @access Private (Government, Admin)
 */
router.get(
  '/analytics',
  authenticate,
  govOrAdmin,
  asyncHandler(async (req, res) => {
    // Get local statistics about blockchain-recorded transactions
    const analytics = await WageRecord.aggregate([
      {
        $group: {
          _id: '$blockchain.recordedOnChain',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const stats = {
      onChain: analytics.find(a => a._id === true) || { count: 0, totalAmount: 0 },
      offChain: analytics.find(a => a._id !== true) || { count: 0, totalAmount: 0 }
    };

    stats.syncRate = stats.onChain.count / (stats.onChain.count + stats.offChain.count) * 100 || 0;

    return successResponse(res, { analytics: stats }, 'Blockchain analytics retrieved');
  })
);

export default router;
