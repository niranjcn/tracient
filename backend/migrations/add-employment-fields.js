/**
 * Migration: Add employment fields to existing Worker records
 * Adds: employmentType, isFarmer, kccLimit
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Worker } from '../models/index.js';
import { logger } from '../utils/logger.util.js';

dotenv.config();

const addEmploymentFields = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Get all workers
    const workers = await Worker.find({});
    logger.info(`Found ${workers.length} workers to update`);

    let updated = 0;
    let skipped = 0;

    for (const worker of workers) {
      let needsUpdate = false;

      // Add employmentType if missing
      if (!worker.employmentType) {
        worker.employmentType = 'informal'; // Default to informal for existing workers
        needsUpdate = true;
      }

      // Add isFarmer if missing
      if (typeof worker.isFarmer !== 'boolean') {
        worker.isFarmer = false; // Default to false
        needsUpdate = true;
      }

      // Add kccLimit if missing
      if (typeof worker.kccLimit !== 'number') {
        worker.kccLimit = 0; // Default to 0
        needsUpdate = true;
      }

      if (needsUpdate) {
        await worker.save();
        updated++;
        logger.info(`Updated worker: ${worker.name} (${worker.idHash?.substring(0, 8)})`);
      } else {
        skipped++;
      }
    }

    logger.info(`Migration completed: ${updated} workers updated, ${skipped} skipped`);
    
    // Verify the migration
    const workersWithoutFields = await Worker.countDocuments({
      $or: [
        { employmentType: { $exists: false } },
        { isFarmer: { $exists: false } },
        { kccLimit: { $exists: false } }
      ]
    });

    if (workersWithoutFields > 0) {
      logger.warn(`Warning: ${workersWithoutFields} workers still missing employment fields`);
    } else {
      logger.info('✅ All workers have employment fields');
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

// Run migration
addEmploymentFields()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
