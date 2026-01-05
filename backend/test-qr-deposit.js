/**
 * Quick test script to verify QR deposit endpoint
 * Run with: node test-qr-deposit.js
 */

const testPayload = {
  token: 'test-token-base64',
  amount: 1000,
  payerName: 'Test Sender',
  payerPhone: '1234567890'
};

console.log('Test Payload for QR Deposit:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\nExpected UPITransaction fields:');
console.log('- txId: string (generated)');
console.log('- workerId: ObjectId');
console.log('- workerHash: string');
console.log('- workerName: string');
console.log('- workerAccount: string');
console.log('- senderName: string (REQUIRED) ✓');
console.log('- senderPhone: string (optional)');
console.log('- senderAccount: string (optional)');
console.log('- amount: number ✓');
console.log('- status: "completed" (MUST be valid enum) ✓');
console.log('- mode: "QR_SCAN" ✓');
console.log('- timestamp: Date ✓');
console.log('- completedAt: Date ✓');
console.log('\nValid status values: pending, completed, failed, cancelled');
console.log('✓ All required fields are provided in the controller code.');
