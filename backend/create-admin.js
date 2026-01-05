/**
 * Create Default Admin User
 * Run this script to create the default admin account
 * Usage: node create-admin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Admin } from './models/index.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracient';

// Default admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@tracient.com',
  password: 'Admin@123456',
  name: 'System Administrator',
  role: 'admin',
  phone: '9999999999',
  idHash: 'admin-default-001'
};

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('Email:', ADMIN_CREDENTIALS.email);
      console.log('\nTo reset password, delete the user and run this script again.');
      
      // Show current admin info
      const adminProfile = await Admin.findOne({ userId: existingAdmin._id });
      if (adminProfile) {
        console.log('\nCurrent Admin Details:');
        console.log('- Name:', existingAdmin.name);
        console.log('- Email:', existingAdmin.email);
        console.log('- Role:', existingAdmin.role);
        console.log('- Status:', existingAdmin.isActive ? 'Active' : 'Inactive');
        console.log('- Created:', existingAdmin.createdAt);
      }
      
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
    console.log('\nCreating admin user...');
    const adminUser = await User.create({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
      name: ADMIN_CREDENTIALS.name,
      role: ADMIN_CREDENTIALS.role,
      phone: ADMIN_CREDENTIALS.phone,
      idHash: ADMIN_CREDENTIALS.idHash,
      isActive: true,
      isVerified: true
    });

    console.log('✓ Admin user created');

    // Create admin profile
    const adminProfile = await Admin.create({
      userId: adminUser._id,
      name: ADMIN_CREDENTIALS.name,
      employeeId: 'ADMIN-001',
      email: ADMIN_CREDENTIALS.email,
      phone: ADMIN_CREDENTIALS.phone,
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
      }
    });

    console.log('✓ Admin profile created');

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEFAULT ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📧 Email:    ', ADMIN_CREDENTIALS.email);
    console.log('🔑 Password: ', ADMIN_CREDENTIALS.password);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    console.log('='.repeat(60));
    console.log('\nYou can now login at: http://localhost:5173/login');
    console.log('\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createDefaultAdmin();
