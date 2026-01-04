/**
 * Scheduled Jobs Runner
 * Handles periodic background tasks
 */
import cron from 'node-cron';
import { syncAllFamilies } from '../services/family-sync.service.js';
import { syncPendingWages, retryFailedSyncs, getSyncStatistics } from '../services/blockchain-sync.service.js';
import { isBlockchainEnabled } from '../config/fabric.js';
import { logger } from '../utils/logger.util.js';

/**
 * Start all scheduled jobs
 */
export const startScheduledJobs = () => {
  logger.info('🕐 Starting scheduled jobs...');

  // Family member count sync - runs daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('⏰ Running scheduled family sync job...');
    try {
      const result = await syncAllFamilies();
      logger.info(`✅ Scheduled family sync completed: ${result.updatedFamilies}/${result.totalFamilies} families updated`);
    } catch (error) {
      logger.error('❌ Scheduled family sync failed:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  // Blockchain sync - runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (!isBlockchainEnabled()) {
      return; // Skip if blockchain is disabled
    }
    
    logger.info('⛓️  Running blockchain sync job...');
    try {
      const result = await syncPendingWages();
      if (result.synced > 0 || result.failed > 0) {
        logger.info(`✅ Blockchain sync: ${result.synced} synced, ${result.failed || 0} failed`);
      }
    } catch (error) {
      logger.error('❌ Blockchain sync failed:', error);
    }
  });

  // Retry failed blockchain syncs - runs every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    if (!isBlockchainEnabled()) {
      return;
    }
    
    logger.info('🔄 Running blockchain retry job...');
    try {
      const result = await retryFailedSyncs();
      if (result.retried > 0) {
        logger.info(`✅ Blockchain retry: ${result.retried} succeeded`);
      }
    } catch (error) {
      logger.error('❌ Blockchain retry failed:', error);
    }
  });

  // Log sync statistics - runs every hour
  cron.schedule('0 * * * *', async () => {
    if (!isBlockchainEnabled()) {
      return;
    }
    
    try {
      const stats = await getSyncStatistics();
      logger.info(`📊 Blockchain stats: ${stats.synced}/${stats.total} synced (${stats.syncRate}%), ${stats.pending} pending, ${stats.failed} failed`);
    } catch (error) {
      logger.error('❌ Failed to get sync statistics:', error);
    }
  });
  
  logger.info('✅ Scheduled jobs initialized');
  logger.info('   - Family sync: Daily at 2:00 AM IST');
  logger.info('   - Blockchain sync: Every 5 minutes');
  logger.info('   - Blockchain retry: Every 30 minutes');
  logger.info('   - Sync statistics: Every hour');
};

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export const stopScheduledJobs = () => {
  logger.info('🛑 Stopping scheduled jobs...');
  cron.getTasks().forEach(task => task.stop());
  logger.info('✅ All scheduled jobs stopped');
};

export default {
  startScheduledJobs,
  stopScheduledJobs
};
