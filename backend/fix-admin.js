/**
 * Fix Existing Admin Account
 * This script will fix/recreate the admin account and profile
 * Usage: node fix-admin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Admin } from './models/index.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracient';

// Admin credentials
const ADMIN_EMAIL = 'admin@tracient.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'System Administrator';

async function fixAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find existing admin user
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    
    if (adminUser) {
      console.log('Found existing admin user');
      console.log('- ID:', adminUser._id);
      console.log('- Email:', adminUser.email);
      console.log('- Role:', adminUser.role);
      console.log('- Active:', adminUser.isActive);
      console.log('- Login Attempts:', adminUser.loginAttempts || 0);
      console.log('- Account Locked:', adminUser.lockUntil ? new Date(adminUser.lockUntil) : 'No');
      
      // Unlock account and reset login attempts
      adminUser.loginAttempts = 0;
      adminUser.lockUntil = undefined;
      adminUser.isActive = true;
      adminUser.isVerified = true;
      
      // Reset password
      adminUser.password = ADMIN_PASSWORD;
      await adminUser.save();
      console.log('\n✓ Account unlocked and password reset');
      
    } else {
      console.log('Creating new admin user...');
      adminUser = await User.create({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
        role: 'admin',
        phone: '9999999999',
        idHash: 'admin-default-001',
        isActive: true,
        isVerified: true,
        loginAttempts: 0
      });
      console.log('✓ Admin user created');
    }

    // Check for admin profile
    let adminProfile = await Admin.findOne({ userId: adminUser._id });
    
    if (adminProfile) {
      console.log('\nFound existing admin profile');
      console.log('- Employee ID:', adminProfile.employeeId);
      console.log('- Admin Level:', adminProfile.adminLevel);
      
      // Update profile to ensure all required fields
      adminProfile.employeeId = adminProfile.employeeId || 'ADMIN-001';
      adminProfile.adminLevel = 'super';
      adminProfile.permissions = {
        manageUsers: true,
        manageWorkers: true,
        manageEmployers: true,
        manageGovOfficials: true,
        manageAdmins: true,
        manageSchemes: true,
        managePolicies: true,
        viewAnalytics: true,
        viewAuditLogs: true,
        manageBlockchain: true,
        systemSettings: true
      };
      adminProfile.isActive = true;
      await adminProfile.save();
      console.log('✓ Admin profile updated');
      
    } else {
      console.log('\nCreating admin profile...');
      adminProfile = await Admin.create({
        userId: adminUser._id,
        name: ADMIN_NAME,
        employeeId: 'ADMIN-001',
        email: ADMIN_EMAIL,
        phone: '9999999999',
        adminLevel: 'super',
        permissions: {
          manageUsers: true,
          manageWorkers: true,
          manageEmployers: true,
          manageGovOfficials: true,
          manageAdmins: true,
          manageSchemes: true,
          managePolicies: true,
          viewAnalytics: true,
          viewAuditLogs: true,
          manageBlockchain: true,
          systemSettings: true
        },
        isActive: true
      });
      console.log('✓ Admin profile created');
    }

    // Display final credentials
    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN ACCOUNT READY');
    console.log('='.repeat(60));
    console.log('\n📧 Email:    ', ADMIN_EMAIL);
    console.log('🔑 Password: ', ADMIN_PASSWORD);
    console.log('👤 User ID:  ', adminUser._id.toString());
    console.log('🆔 Employee:', adminProfile.employeeId);
    console.log('⭐ Level:    ', adminProfile.adminLevel);
    console.log('\n✅ Account unlocked - Ready to login!');
    console.log('='.repeat(60));
    console.log('\nLogin at: http://localhost:5173/login\n');

    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixAdmin();
