/**
 * Blockchain Synchronization Service
 * Handles periodic sync of pending transactions to blockchain
 */
import { WageRecord } from '../models/index.js';
import { 
  recordWagePayment, 
  batchRecordWages, 
  getNetworkStatus 
} from './fabric.service.js';
import { isFabricConnected, isBlockchainEnabled } from '../config/fabric.js';
import { logger } from '../utils/logger.util.js';

// Track sync status
let syncInProgress = false;
let lastSyncTime = null;
let lastSyncResult = null;

/**
 * Get sync service status
 */
export const getSyncStatus = () => {
  return {
    syncInProgress,
    lastSyncTime,
    lastSyncResult,
    blockchainEnabled: isBlockchainEnabled(),
    blockchainConnected: isFabricConnected()
  };
};

/**
 * Sync all pending wages to blockchain
 */
export const syncPendingWages = async () => {
  // Prevent concurrent syncs
  if (syncInProgress) {
    logger.warn('Sync already in progress, skipping...');
    return { synced: 0, message: 'Sync already in progress' };
  }

  // Check if blockchain is enabled
  if (!isBlockchainEnabled()) {
    logger.info('Blockchain is disabled, skipping sync');
    return { synced: 0, message: 'Blockchain disabled' };
  }

  // Check if connected
  if (!isFabricConnected()) {
    logger.warn('Blockchain not connected, skipping sync');
    return { synced: 0, message: 'Not connected to blockchain' };
  }

  syncInProgress = true;
  const startTime = Date.now();

  try {
    // Find all wages not synced to blockchain
    const pendingWages = await WageRecord.find({
      syncedToBlockchain: false,
      status: { $in: ['completed', 'pending'] },
      $or: [
        { blockchainSyncError: { $exists: false } },
        { blockchainSyncError: null }
      ]
    })
    .populate('workerId', 'idHash')
    .populate('employerId', 'idHash')
    .limit(50) // Process in batches of 50
    .lean();
    
    if (pendingWages.length === 0) {
      logger.info('No pending wages to sync');
      lastSyncTime = new Date();
      lastSyncResult = { synced: 0, failed: 0 };
      return { synced: 0, message: 'No pending wages' };
    }
    
    logger.info(`Syncing ${pendingWages.length} pending wages to blockchain`);
    
    let syncedCount = 0;
    let failedCount = 0;
    const errors = [];

    // Process each wage individually for better error tracking
    for (const wage of pendingWages) {
      try {
        const workerIdHash = wage.workerId?.idHash || wage.workerIdHash;
        const employerIdHash = wage.employerId?.idHash || 'SELF_DECLARED';

        const result = await recordWagePayment({
          workerId: wage.workerId?._id || wage.workerId,
          workerIdHash: workerIdHash,
          employerId: wage.employerId?._id || wage.employerId,
          employerIdHash: employerIdHash,
          amount: wage.amount,
          referenceNumber: wage.referenceNumber,
          timestamp: wage.initiatedAt?.toISOString() || new Date().toISOString()
        });

        if (result.success) {
          // Update MongoDB record with blockchain info
          await WageRecord.findByIdAndUpdate(wage._id, {
            syncedToBlockchain: true,
            verifiedOnChain: true,
            blockchainTxId: result.txHash,
            blockchainSyncError: null
          });
          syncedCount++;
        } else {
          // Mark the error but don't prevent other syncs
          await WageRecord.findByIdAndUpdate(wage._id, {
            blockchainSyncError: result.error || 'Unknown error'
          });
          failedCount++;
          errors.push({ id: wage._id, error: result.error });
        }
      } catch (error) {
        failedCount++;
        errors.push({ id: wage._id, error: error.message });
        
        // Update record with error
        await WageRecord.findByIdAndUpdate(wage._id, {
          blockchainSyncError: error.message
        });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info(`Sync completed: ${syncedCount} synced, ${failedCount} failed in ${duration}ms`);
    
    lastSyncTime = new Date();
    lastSyncResult = { synced: syncedCount, failed: failedCount, duration, errors };
    
    return { 
      synced: syncedCount, 
      failed: failedCount,
      duration,
      errors: errors.slice(0, 5) // Return first 5 errors only
    };
  } catch (error) {
    logger.error('Sync service error:', error);
    lastSyncResult = { synced: 0, error: error.message };
    return { synced: 0, error: error.message };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Retry failed syncs
 */
export const retryFailedSyncs = async () => {
  if (syncInProgress) {
    logger.warn('Sync in progress, skipping retry...');
    return { retried: 0, message: 'Sync in progress' };
  }

  if (!isBlockchainEnabled() || !isFabricConnected()) {
    return { retried: 0, message: 'Blockchain not available' };
  }

  syncInProgress = true;

  try {
    // Find wages with sync errors
    const failedWages = await WageRecord.find({
      syncedToBlockchain: false,
      blockchainSyncError: { $exists: true, $ne: null }
    })
    .populate('workerId', 'idHash')
    .populate('employerId', 'idHash')
    .limit(20)
    .lean();
    
    if (failedWages.length === 0) {
      return { retried: 0, message: 'No failed syncs to retry' };
    }
    
    logger.info(`Retrying ${failedWages.length} failed syncs`);
    
    let successCount = 0;
    let stillFailedCount = 0;

    for (const wage of failedWages) {
      try {
        const workerIdHash = wage.workerId?.idHash || wage.workerIdHash;
        const employerIdHash = wage.employerId?.idHash || 'SELF_DECLARED';

        const result = await recordWagePayment({
          workerId: wage.workerId?._id || wage.workerId,
          workerIdHash: workerIdHash,
          employerId: wage.employerId?._id || wage.employerId,
          employerIdHash: employerIdHash,
          amount: wage.amount,
          referenceNumber: wage.referenceNumber,
          timestamp: wage.initiatedAt?.toISOString() || new Date().toISOString()
        });
        
        if (result.success) {
          await WageRecord.findByIdAndUpdate(wage._id, {
            syncedToBlockchain: true,
            verifiedOnChain: true,
            blockchainTxId: result.txHash,
            blockchainSyncError: null
          });
          successCount++;
        } else {
          stillFailedCount++;
        }
      } catch (error) {
        logger.error(`Failed to retry sync for ${wage._id}:`, error.message);
        stillFailedCount++;
      }
    }
    
    logger.info(`Retry completed: ${successCount} succeeded, ${stillFailedCount} still failed`);
    return { retried: successCount, stillFailed: stillFailedCount };
  } catch (error) {
    logger.error('Retry service error:', error);
    return { retried: 0, error: error.message };
  } finally {
    syncInProgress = false;
  }
};

/**
 * Get sync statistics
 */
export const getSyncStatistics = async () => {
  try {
    const stats = await WageRecord.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          synced: {
            $sum: { $cond: [{ $eq: ['$syncedToBlockchain', true] }, 1, 0] }
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$syncedToBlockchain', true] },
                    { $not: { $ifNull: ['$blockchainSyncError', false] } }
                  ]
                },
                1,
                0
              ]
            }
          },
          failed: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ['$syncedToBlockchain', true] },
                  { $ifNull: ['$blockchainSyncError', false] }
                ]},
                1,
                0
              ]
            }
          },
          totalAmount: { $sum: '$amount' },
          syncedAmount: {
            $sum: { $cond: [{ $eq: ['$syncedToBlockchain', true] }, '$amount', 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      synced: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0,
      syncedAmount: 0
    };

    result.syncRate = result.total > 0 
      ? ((result.synced / result.total) * 100).toFixed(2) 
      : 0;

    return result;
  } catch (error) {
    logger.error('Failed to get sync statistics:', error);
    return { error: error.message };
  }
};

/**
 * Force sync a specific wage record
 */
export const forceSyncWage = async (wageId) => {
  try {
    const wage = await WageRecord.findById(wageId)
      .populate('workerId', 'idHash')
      .populate('employerId', 'idHash');

    if (!wage) {
      return { success: false, error: 'Wage record not found' };
    }

    const workerIdHash = wage.workerId?.idHash || wage.workerIdHash;
    const employerIdHash = wage.employerId?.idHash || 'SELF_DECLARED';

    const result = await recordWagePayment({
      workerId: wage.workerId?._id || wage.workerId,
      workerIdHash: workerIdHash,
      employerId: wage.employerId?._id || wage.employerId,
      employerIdHash: employerIdHash,
      amount: wage.amount,
      referenceNumber: wage.referenceNumber,
      timestamp: wage.initiatedAt?.toISOString() || new Date().toISOString()
    });

    if (result.success) {
      wage.syncedToBlockchain = true;
      wage.verifiedOnChain = true;
      wage.blockchainTxId = result.txHash;
      wage.blockchainSyncError = null;
      await wage.save();
      
      return { success: true, txHash: result.txHash };
    } else {
      wage.blockchainSyncError = result.error;
      await wage.save();
      
      return { success: false, error: result.error };
    }
  } catch (error) {
    logger.error(`Force sync failed for ${wageId}:`, error);
    return { success: false, error: error.message };
  }
};

export default {
  getSyncStatus,
  syncPendingWages,
  retryFailedSyncs,
  getSyncStatistics,
  forceSyncWage
};
