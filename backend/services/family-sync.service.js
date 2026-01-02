/**
 * Family Sync Service
 * Automatically detects and syncs family member counts
 */
import { Family, User } from '../models/index.js';
import { logger } from '../utils/logger.util.js';

/**
 * Check and update family size for a specific ration number
 * Called when a new user registers with an existing ration number
 */
export const syncFamilyMemberCount = async (ration_no) => {
  try {
    if (!ration_no) return;

    // Count actual users with this ration number
    const actualMemberCount = await User.countDocuments({ ration_no });
    
    // Find family record
    const family = await Family.findOne({ ration_no });
    
    if (!family) {
      logger.info(`No family record found for ration ${ration_no}, skipping sync`);
      return;
    }

    // Check if update needed
    if (family.family_size < actualMemberCount) {
      const oldSize = family.family_size;
      family.family_size = actualMemberCount;
      family.requires_update = true;
      family.last_auto_update = new Date();
      await family.save();
      
      logger.info(`✅ Auto-synced family ${ration_no}: ${oldSize} → ${actualMemberCount} members (ALL users flagged for update)`);
      return {
        updated: true,
        oldSize,
        newSize: actualMemberCount,
        ration_no
      };
    }
    
    return { updated: false, currentSize: family.family_size };
  } catch (error) {
    logger.error(`Error syncing family member count for ration ${ration_no}:`, error);
    throw error;
  }
};

/**
 * Periodic job to sync all families
 * Run this as a scheduled job (e.g., daily at midnight)
 */
export const syncAllFamilies = async () => {
  logger.info('🔄 Starting family member count sync for all families...');
  
  try {
    const families = await Family.find({});
    let syncedCount = 0;
    let updatedCount = 0;

    for (const family of families) {
      try {
        const actualMemberCount = await User.countDocuments({ 
          ration_no: family.ration_no 
        });

        if (family.family_size < actualMemberCount) {
          const oldSize = family.family_size;
          family.family_size = actualMemberCount;
          family.requires_update = true;
          family.last_auto_update = new Date();
          await family.save();
          
          logger.info(`  ✅ Synced family ${family.ration_no}: ${oldSize} → ${actualMemberCount} (flagged for update)`);
          updatedCount++;
        }
        
        syncedCount++;
      } catch (err) {
        logger.error(`  ❌ Error syncing family ${family.ration_no}:`, err.message);
      }
    }

    logger.info(`✅ Family sync complete: ${syncedCount} checked, ${updatedCount} updated`);
    
    return {
      success: true,
      totalFamilies: syncedCount,
      updatedFamilies: updatedCount
    };
  } catch (error) {
    logger.error('❌ Error in syncAllFamilies:', error);
    throw error;
  }
};

/**
 * Check if a family needs updating without actually updating it
 * Used for notifications/alerts
 */
export const checkFamilySyncStatus = async (ration_no) => {
  try {
    if (!ration_no) return { needsSync: false };

    const actualMemberCount = await User.countDocuments({ ration_no });
    const family = await Family.findOne({ ration_no });

    if (!family) {
      return { needsSync: false, reason: 'No family record' };
    }

    const needsSync = family.family_size < actualMemberCount;

    return {
      needsSync,
      currentSize: family.family_size,
      actualSize: actualMemberCount,
      difference: actualMemberCount - family.family_size
    };
  } catch (error) {
    logger.error(`Error checking family sync status for ration ${ration_no}:`, error);
    throw error;
  }
};

export default {
  syncFamilyMemberCount,
  syncAllFamilies,
  checkFamilySyncStatus
};
