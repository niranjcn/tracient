/**
 * Database Migrations Script
 * Run this script to update existing collections with new fields
 * 
 * Usage: node migrations.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Worker, Employer } from './models/index.js';
import { logger } from './utils/logger.util.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracient';

/**
 * Migration: Add ration_no field to existing users
 * This migration adds the ration_no field to all users who don't have it
 */
async function addRationNoToUsers() {
  console.log('\n--- Migration: Add ration_no field to Users ---');
  
  try {
    // Find all users without ration_no field
    const usersWithoutRation = await User.find({
      $or: [
        { ration_no: { $exists: false } },
        { ration_no: null }
      ]
    });

    console.log(`Found ${usersWithoutRation.length} users without ration_no field`);

    if (usersWithoutRation.length === 0) {
      console.log('✓ All users already have ration_no field (or it\'s null)');
      return;
    }

    // Update users to have ration_no as null (allowing them to fill it later)
    const result = await User.updateMany(
      {
        $or: [
          { ration_no: { $exists: false } }
        ]
      },
      {
        $set: { ration_no: null }
      }
    );

    console.log(`✓ Updated ${result.modifiedCount} users with ration_no field`);
    
  } catch (error) {
    console.error('✗ Error in addRationNoToUsers migration:', error);
    throw error;
  }
}

/**
 * Migration: Verify indexes for ration_no
 * Ensures indexes are properly set up (they're created by the schema)
 */
async function createRationNoIndexes() {
  console.log('\n--- Migration: Verify and fix indexes for ration_no ---');
  
  try {
    // Get all User indexes
    const userIndexes = await User.collection.indexes();
    console.log('Current User indexes:', userIndexes.map(i => i.name).join(', '));
    
    // Drop duplicate ration_no indexes if they exist
    for (const idx of userIndexes) {
      if (idx.key.ration_no && idx.name !== 'ration_no_1') {
        try {
          await User.collection.dropIndex(idx.name);
          console.log(`  Dropped duplicate index: ${idx.name}`);
        } catch (err) {
          console.log(`  Could not drop ${idx.name}: ${err.message}`);
        }
      }
    }

    // Check Family indexes
    try {
      const { Family } = await import('./models/index.js');
      const familyIndexes = await Family.collection.indexes();
      console.log('Current Family indexes:', familyIndexes.map(i => i.name).join(', '));
      
      // Drop duplicate ration_no indexes if they exist
      for (const idx of familyIndexes) {
        if (idx.key.ration_no && idx.name !== 'ration_no_1') {
          try {
            await Family.collection.dropIndex(idx.name);
            console.log(`  Dropped duplicate Family index: ${idx.name}`);
          } catch (err) {
            console.log(`  Could not drop ${idx.name}: ${err.message}`);
          }
        }
      }
    } catch (error) {
      console.log('Family collection not yet created');
    }

    console.log('✓ Index verification complete');
    
  } catch (error) {
    console.error('✗ Error verifying indexes:', error);
    throw error;
  }
}

/**
 * Migration: Validate existing ration numbers
 * Ensures all existing ration numbers are valid 12-digit numbers
 */
async function validateExistingRationNumbers() {
  console.log('\n--- Migration: Validate existing ration numbers ---');
  
  try {
    const usersWithRation = await User.find({
      ration_no: { $exists: true, $ne: null }
    });

    console.log(`Found ${usersWithRation.length} users with ration numbers`);

    let invalidCount = 0;
    
    for (const user of usersWithRation) {
      const rationNo = user.ration_no.toString();
      
      // Check if it's exactly 12 digits
      if (!/^\d{12}$/.test(rationNo)) {
        console.log(`⚠ Invalid ration number for user ${user._id}: ${user.ration_no}`);
        invalidCount++;
      }
    }

    if (invalidCount === 0) {
      console.log('✓ All ration numbers are valid');
    } else {
      console.log(`⚠ Found ${invalidCount} invalid ration numbers`);
    }
    
  } catch (error) {
    console.error('✗ Error validating ration numbers:', error);
    throw error;
  }
}

/**
 * Migration: Link users to families
 * Creates Family records for users who have ration_no but no family entry
 */
async function linkUsersToFamilies() {
  console.log('\n--- Migration: Link users to families ---');
  
  try {
    const { Family } = await import('./models/index.js');
    
    // Find users with ration_no
    const usersWithRation = await User.find({
      ration_no: { $exists: true, $ne: null }
    }).select('_id name email ration_no');

    console.log(`Found ${usersWithRation.length} users with ration numbers`);

    // Group users by ration_no
    const familyGroups = {};
    usersWithRation.forEach(user => {
      const rationNo = user.ration_no;
      if (!familyGroups[rationNo]) {
        familyGroups[rationNo] = [];
      }
      familyGroups[rationNo].push(user);
    });

    console.log(`Found ${Object.keys(familyGroups).length} unique ration numbers`);

    // Check which families already exist
    const existingFamilies = await Family.find({
      ration_no: { $in: Object.keys(familyGroups).map(Number) }
    }).select('ration_no');

    const existingRationNos = new Set(existingFamilies.map(f => f.ration_no));

    console.log(`${existingRationNos.size} families already exist in database`);
    console.log(`${Object.keys(familyGroups).length - existingRationNos.size} families need survey completion`);

    // Log family members for each ration number
    for (const [rationNo, members] of Object.entries(familyGroups)) {
      console.log(`\nRation ${rationNo}:`);
      members.forEach(member => {
        console.log(`  - ${member.name} (${member.email})`);
      });
    }
    
  } catch (error) {
    console.error('✗ Error linking users to families:', error);
    throw error;
  }
}

/**
 * Migration: Assign random ration numbers to users
 * Assigns random ration numbers to users without one, ensuring some users share ration numbers
 */
async function assignRandomRationNumbers() {
  console.log('\n--- Migration: Assign random ration numbers ---');
  
  try {
    const usersWithoutRation = await User.find({
      $or: [
        { ration_no: { $exists: false } },
        { ration_no: null }
      ]
    });

    console.log(`Found ${usersWithoutRation.length} users without ration numbers`);

    if (usersWithoutRation.length === 0) {
      console.log('✓ All users already have ration numbers');
      return;
    }

    // Generate random 12-digit ration numbers
    const generateRationNumber = () => {
      const min = 100000000000;
      const max = 999999999999;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Assign ration numbers - make some users share the same number
    let updatedCount = 0;
    let sharedRationNo = null;
    let sharedCount = 0;

    for (let i = 0; i < usersWithoutRation.length; i++) {
      const user = usersWithoutRation[i];
      let rationNo;

      // For every 3rd and 4th user, use the same ration number
      // This creates family groups for testing
      if (i > 0 && i % 4 === 0) {
        sharedRationNo = generateRationNumber();
        rationNo = sharedRationNo;
        sharedCount = 1;
        console.log(`Creating family group with ration number: ${rationNo}`);
      } else if (sharedRationNo && sharedCount < 2) {
        rationNo = sharedRationNo;
        sharedCount++;
        console.log(`  Adding family member with ration number: ${rationNo}`);
        sharedRationNo = null; // Reset after 2 members
      } else {
        rationNo = generateRationNumber();
      }

      user.ration_no = rationNo;
      await user.save();
      
      console.log(`  Assigned ${rationNo} to ${user.name} (${user.email})`);
      updatedCount++;
    }

    console.log(`✓ Assigned ration numbers to ${updatedCount} users`);
    console.log('✓ Some users share ration numbers for family testing');
    
  } catch (error) {
    console.error('✗ Error assigning ration numbers:', error);
    throw error;
  }
}

/**
 * Migration: Generate statistics
 * Provides overview of the database state
 */
async function generateStatistics() {
  console.log('\n--- Database Statistics ---');
  
  try {
    const totalUsers = await User.countDocuments();
    const usersWithRation = await User.countDocuments({
      ration_no: { $exists: true, $ne: null }
    });
    const usersWithoutRation = totalUsers - usersWithRation;

    console.log(`Total Users: ${totalUsers}`);
    console.log(`Users with Ration Number: ${usersWithRation} (${((usersWithRation/totalUsers)*100).toFixed(1)}%)`);
    console.log(`Users without Ration Number: ${usersWithoutRation} (${((usersWithoutRation/totalUsers)*100).toFixed(1)}%)`);

    // Count by role
    const roles = ['worker', 'employer', 'government', 'admin'];
    console.log('\nUsers by Role:');
    for (const role of roles) {
      const count = await User.countDocuments({ role });
      const withRation = await User.countDocuments({ 
        role, 
        ration_no: { $exists: true, $ne: null } 
      });
      console.log(`  ${role}: ${count} (${withRation} with ration number)`);
    }

    // Family statistics
    try {
      const { Family } = await import('./models/index.js');
      const totalFamilies = await Family.countDocuments();
      console.log(`\nTotal Families: ${totalFamilies}`);
    } catch (error) {
      console.log('\nFamily collection not found or error accessing it');
    }
    
  } catch (error) {
    console.error('✗ Error generating statistics:', error);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  console.log('='.repeat(60));
  console.log('Starting Database Migrations');
  console.log('='.repeat(60));
  console.log(`MongoDB URI: ${MONGODB_URI.substring(0, 30)}...`);
  console.log(`Date: ${new Date().toISOString()}`);
  
  try {
    // Connect to MongoDB
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });
    console.log('✓ Connected to MongoDB\n');

    // Run migrations in sequence
    await addRationNoToUsers();
    await assignRandomRationNumbers(); // Assign random ration numbers with family grouping
    await createRationNoIndexes();
    await validateExistingRationNumbers();
    await linkUsersToFamilies();
    await generateStatistics();

    console.log('\n' + '='.repeat(60));
    console.log('All migrations completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('Migration failed with error:');
    console.error(error);
    console.error('='.repeat(60));
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run migrations if this file is executed directly
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

if (process.argv[1] && (fileURLToPath(import.meta.url) === resolve(process.argv[1]))) {
  runMigrations()
    .then(() => {
      console.log('\nMigration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error);
      process.exit(1);
    });
}

export {
  addRationNoToUsers,
  assignRandomRationNumbers,
  createRationNoIndexes,
  validateExistingRationNumbers,
  linkUsersToFamilies,
  generateStatistics,
  runMigrations
};
