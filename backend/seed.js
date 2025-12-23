import { connectDB, disconnectDB } from './config/database.js';
import { Worker } from './models/Worker.js';

const seedWorkers = async () => {
  try {
    await connectDB();

    // Clear existing workers
    await Worker.deleteMany({});
    console.log('🗑️  Cleared existing workers');

    // Create predefined workers
    const workers = [
      {
        idHash: 'aadhar-hash-001',
        name: 'Rajesh Kumar',
        phone: '9876543210',
        bankAccount: 'TRCNT-0001-001',
        balance: 0,
        registered: true,
      },
      {
        idHash: 'aadhar-hash-002',
        name: 'Priya Singh',
        phone: '9876543211',
        bankAccount: 'TRCNT-0002-002',
        balance: 0,
        registered: true,
      },
      {
        idHash: 'aadhar-hash-003',
        name: 'Amit Patel',
        phone: '9876543212',
        bankAccount: 'TRCNT-0003-003',
        balance: 0,
        registered: true,
      },
    ];

    await Worker.insertMany(workers);
    console.log('✅ Seeded 3 predefined workers');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedWorkers();
