/**
 * Scheduled Jobs Runner
 * Handles periodic background tasks
 */
import cron from 'node-cron';
import { syncAllFamilies } from '../services/family-sync.service.js';
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
    timezone: 'Asia/Kolkata' // Adjust to your timezone
  });

  // You can add more scheduled jobs here
  // Example: Data cleanup, report generation, etc.
  
  logger.info('✅ Scheduled jobs initialized');
  logger.info('   - Family sync: Daily at 2:00 AM IST');
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
