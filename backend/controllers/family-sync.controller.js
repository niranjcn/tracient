/**
 * Family Sync Controller
 * Handles family member count synchronization
 */
import { syncAllFamilies, syncFamilyMemberCount } from '../services/family-sync.service.js';
import { logger } from '../utils/logger.util.js';

export const familySyncController = {
  /**
   * Manually trigger sync for all families
   * @route POST /api/family/sync/all
   * @access Private (Admin, Government)
   */
  async syncAll(req, res, next) {
    try {
      logger.info('Manual family sync triggered by:', req.user.email);
      
      const result = await syncAllFamilies();
      
      res.json({
        success: true,
        message: `Synced ${result.updatedFamilies} out of ${result.totalFamilies} families`,
        data: result
      });
    } catch (error) {
      logger.error('Error in manual family sync:', error);
      next(error);
    }
  },

  /**
   * Sync specific family by ration number
   * @route POST /api/family/sync/:ration_no
   * @access Private (Admin, Government)
   */
  async syncByRation(req, res, next) {
    try {
      const { ration_no } = req.params;
      
      logger.info(`Manual sync for ration ${ration_no} by:`, req.user.email);
      
      const result = await syncFamilyMemberCount(parseInt(ration_no));
      
      if (result.updated) {
        res.json({
          success: true,
          message: `Family size updated from ${result.oldSize} to ${result.newSize}`,
          data: result
        });
      } else {
        res.json({
          success: true,
          message: 'Family size is already correct',
          data: result
        });
      }
    } catch (error) {
      logger.error(`Error syncing family ${req.params.ration_no}:`, error);
      next(error);
    }
  }
};

export default familySyncController;
