import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Family } from './models/Family.js';
import dotenv from 'dotenv';

dotenv.config();

async function verifyDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check Users collection
    console.log('📊 USERS COLLECTION VERIFICATION');
    console.log('═'.repeat(50));
    
    const totalUsers = await User.countDocuments();
    console.log(`Total users: ${totalUsers}`);
    
    const usersWithRationNo = await User.countDocuments({ ration_no: { $exists: true, $ne: null } });
    console.log(`Users with ration_no: ${usersWithRationNo}`);
    
    const usersWithoutRationNo = await User.countDocuments({ 
      $or: [
        { ration_no: { $exists: false } },
        { ration_no: null }
      ]
    });
    console.log(`Users without ration_no: ${usersWithoutRationNo}\n`);

    // Get sample users with ration numbers
    const sampleUsers = await User.find({ ration_no: { $exists: true, $ne: null } })
      .select('name email role ration_no')
      .limit(10)
      .lean();
    
    console.log('📋 Sample users with ration numbers:');
    console.log('─'.repeat(50));
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Ration No: ${user.ration_no}`);
      console.log(`   Valid format: ${/^\d{12}$/.test(user.ration_no?.toString()) ? '✅' : '❌'}`);
      console.log('');
    });

    // Check for families (shared ration numbers)
    console.log('👨‍👩‍👧‍👦 FAMILY GROUPINGS VERIFICATION');
    console.log('═'.repeat(50));
    
    const rationNumbers = await User.aggregate([
      { $match: { ration_no: { $exists: true, $ne: null } } },
      { $group: { _id: '$ration_no', count: { $sum: 1 }, members: { $push: { name: '$name', role: '$role' } } } },
      { $sort: { count: -1 } }
    ]);

    const uniqueRationNumbers = rationNumbers.length;
    console.log(`Total unique ration numbers: ${uniqueRationNumbers}`);
    
    const familiesWithMultipleMembers = rationNumbers.filter(r => r.count > 1);
    console.log(`Families with multiple members: ${familiesWithMultipleMembers.length}\n`);

    if (familiesWithMultipleMembers.length > 0) {
      console.log('📋 Families with multiple members:');
      console.log('─'.repeat(50));
      familiesWithMultipleMembers.forEach((family, index) => {
        console.log(`${index + 1}. Ration No: ${family._id}`);
        console.log(`   Members: ${family.count}`);
        family.members.forEach((member, i) => {
          console.log(`   ${i + 1}) ${member.name} (${member.role})`);
        });
        console.log('');
      });
    }

    // Check Family collection
    console.log('🏠 FAMILY COLLECTION VERIFICATION');
    console.log('═'.repeat(50));
    
    const totalFamilies = await Family.countDocuments();
    console.log(`Total family records: ${totalFamilies}`);
    
    if (totalFamilies > 0) {
      const sampleFamilies = await Family.find()
        .select('ration_no family_size highest_earner_monthly')
        .limit(5)
        .lean();
      
      console.log('\n📋 Sample family records:');
      console.log('─'.repeat(50));
      sampleFamilies.forEach((family, index) => {
        console.log(`${index + 1}. Ration No: ${family.ration_no}`);
        console.log(`   Family Size: ${family.family_size || 'Not set'}`);
        console.log(`   Highest Earner Monthly: ₹${family.highest_earner_monthly || 'Not set'}`);
        console.log('');
      });
    }

    // Data integrity checks
    console.log('🔍 DATA INTEGRITY CHECKS');
    console.log('═'.repeat(50));
    
    // Check for invalid ration numbers
    const invalidRationNos = await User.find({ 
      ration_no: { $exists: true, $ne: null },
      $or: [
        { ration_no: { $lt: 100000000000 } },
        { ration_no: { $gt: 999999999999 } }
      ]
    }).countDocuments();
    
    console.log(`Invalid ration numbers (not 12 digits): ${invalidRationNos} ${invalidRationNos === 0 ? '✅' : '❌'}`);
    
    // Check for duplicate ration numbers in Family collection
    const duplicateFamilyRationNos = await Family.aggregate([
      { $group: { _id: '$ration_no', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log(`Duplicate ration numbers in Family: ${duplicateFamilyRationNos.length} ${duplicateFamilyRationNos.length === 0 ? '✅' : '❌'}`);

    console.log('\n✨ Database verification completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

verifyDatabase();
