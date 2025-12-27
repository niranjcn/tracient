# Payment Simulation System - Complete Implementation Guide

## Overview

This guide explains how to create a complete online payment simulation system using the QR code and bank accounts feature already in place.

---

## System Architecture

### Components:
1. **QR Code Generation** (Worker) - Already implemented
2. **QR Code Scanning** (Employer/Payer) - Already implemented
3. **Payment Processing** (Simulated) - Need to enhance
4. **Transaction Recording** - Already in place
5. **Balance Updates** - Need to implement
6. **Payment Confirmation** - Already implemented

---

## Current Implementation

### What Already Exists:

#### **1. Frontend QR Code Generation** (`/worker/generate-qr`)
- Workers select bank account
- Generate scannable QR code
- QR encodes: workerHash, accountId, accountNumber, bankName, IFSC, timestamp

#### **2. Frontend QR Scanning** (`/scan-qr`)
- Payer enters QR token
- Verify QR code authenticity
- Display recipient details
- Enter payment amount
- Submit payment

#### **3. Backend Endpoints**
```
POST /api/workers/qr/generate    - Generate QR code
POST /workers/qr/verify          - Verify scanned QR
POST /workers/qr/deposit         - Process payment
```

---

## Enhanced Payment Simulation Flow

### Step-by-Step Process:

```
WORKER SIDE:
├── Profile > Bank Accounts
├── Add/Select Bank Account
├── Go to Payments (Generate QR)
├── Select Account
└── Generate QR Code → Display QR + Token

PAYER SIDE (Employer/Admin):
├── Go to Scan QR Page (/scan-qr)
├── Enter QR Token (or scan QR code)
├── Verify QR → See Recipient Details
│   ├── Account Holder Name
│   ├── Bank Name
│   ├── Account Number (masked)
│   └── IFSC Code
├── Enter Payment Amount
├── Click "Pay" Button
└── Simulate Payment

BACKEND PROCESSING:
├── Validate QR Token
├── Verify Worker Account
├── Update Worker Balance (+amount)
├── Create Transaction Record
├── Log Audit Trail
├── Return Success with TransactionID
└── Return New Balance

CONFIRMATION:
├── Show Transaction ID
├── Show Amount Transferred
├── Show New Account Balance
├── Show Timestamp
└── Option for New Payment
```

---

## Implementation Components

### 1. Enhanced Payment Processing Endpoint

**File**: `backend/routes/upi.routes.js` or `backend/routes/worker.routes.js`

```javascript
/**
 * @route POST /api/workers/qr/deposit
 * @desc Simulate payment deposit via QR code
 * @access Public (Employer, Payer)
 */
router.post(
  '/qr/deposit',
  body('token').notEmpty().withMessage('QR token is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be > 0'),
  validate,
  workerController.depositViaQR
);
```

### 2. Payment Processing Controller

**File**: `backend/controllers/worker.controller.js`

```javascript
/**
 * Simulate payment deposit via QR code
 */
export const depositViaQR = async (req, res) => {
  try {
    const { token, amount, payerName = 'Anonymous' } = req.body;

    if (!token || !amount) {
      return errorResponse(res, 'Token and amount are required', 400);
    }

    // Decode QR token
    let qrData;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      qrData = JSON.parse(decoded);
    } catch (error) {
      return errorResponse(res, 'Invalid QR token format', 400);
    }

    const { workerIdHash, accountId } = qrData;

    // Find worker and account
    const worker = await Worker.findOne({ idHash: workerIdHash });
    if (!worker) {
      return errorResponse(res, 'Worker not found', 404);
    }

    const account = worker.bankAccounts?.id(accountId);
    if (!account) {
      return errorResponse(res, 'Bank account not found', 404);
    }

    // Check QR expiry
    const expiryTime = new Date(qrData.expiresAt);
    if (new Date() > expiryTime) {
      return errorResponse(res, 'QR code has expired', 400);
    }

    // Update balance
    const previousBalance = account.balance || 0;
    account.balance = previousBalance + amount;
    account.balanceLastUpdated = new Date();

    // Update monthly income
    if (!account.monthlyIncome) {
      account.monthlyIncome = 0;
    }
    account.monthlyIncome += amount;

    // Update worker total earnings
    worker.totalEarnings = (worker.totalEarnings || 0) + amount;
    worker.balance = (worker.balance || 0) + amount;

    await worker.save();

    // Create transaction record
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const transaction = await UPITransaction.create({
      txId: transactionId,
      workerId: worker._id,
      workerHash: workerIdHash,
      workerName: worker.name,
      workerAccount: account.accountNumber,
      payerName: payerName,
      amount: amount,
      status: 'success',
      paymentMethod: 'QR_SCAN',
      bankName: account.bankName,
      ifscCode: account.ifscCode,
      timestamp: new Date()
    });

    // Log audit trail
    await AuditLog.log({
      action: 'payment_received',
      category: 'transaction',
      userId: worker.userId,
      resourceType: 'Worker',
      resourceId: worker._id,
      details: {
        amount: amount,
        transactionId: transactionId,
        paymentMethod: 'QR_SCAN'
      }
    });

    logger.info('Payment via QR received', {
      workerId: worker._id,
      transactionId: transactionId,
      amount: amount,
      accountNumber: account.accountNumber.slice(-4)
    });

    return successResponse(res, {
      transactionId: transactionId,
      amount: amount,
      bankName: account.bankName,
      accountHolderName: account.accountHolderName,
      newBalance: account.balance,
      previousBalance: previousBalance,
      timestamp: new Date().toISOString(),
      accountNumber: `****${account.accountNumber.slice(-4)}`
    }, 'Payment successful');

  } catch (error) {
    logger.error('Deposit via QR error:', error);
    return errorResponse(res, error.message, 500);
  }
};
```

### 3. QR Verification Endpoint

```javascript
/**
 * Verify QR token and return recipient details
 */
export const verifyQRToken = async (req, res) => {
  try {
    let { token } = req.body;

    if (!token) {
      return errorResponse(res, 'QR token is required', 400);
    }

    token = token.trim();

    // Decode token
    let tokenData;
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      tokenData = JSON.parse(decoded);
    } catch (error) {
      return errorResponse(res, 'Invalid QR token format', 400);
    }

    const { workerIdHash, accountId, expiresAt } = tokenData;

    // Check expiry
    if (new Date() > new Date(expiresAt)) {
      return errorResponse(res, 'QR code has expired', 400);
    }

    // Find worker
    const worker = await Worker.findOne({ idHash: workerIdHash });
    if (!worker) {
      return errorResponse(res, 'Worker not registered', 404);
    }

    const account = worker.bankAccounts?.id(accountId);
    if (!account) {
      return errorResponse(res, 'Bank account not found', 404);
    }

    return successResponse(res, {
      workerHash: workerIdHash,
      accountId: accountId,
      bankName: account.bankName,
      accountHolderName: account.accountHolderName,
      accountNumberMasked: `****${account.accountNumber.slice(-4)}`,
      ifscCode: account.ifscCode,
      country: account.country,
      isValid: true,
      expiresAt: expiresAt
    }, 'QR code verified');

  } catch (error) {
    logger.error('Verify QR error:', error);
    return errorResponse(res, 'Failed to verify QR code', 500);
  }
};
```

---

## Frontend Implementation

### 1. Scan QR Page (`/scan-qr`)

The page already exists and supports:
- Manual QR token input
- QR verification
- Payment amount entry
- Payment submission
- Transaction confirmation

### 2. Generate QR Page (`/worker/generate-qr`)

Already supports:
- Bank account selection
- QR code generation
- Display scannable QR image
- Show account details
- Copy token functionality

### 3. Service Methods

```typescript
// wageService.ts
export const wageService = {
  // Generate QR code
  generateQRCode: async (accountId: string): Promise<any> => {
    return post('/workers/qr/generate', { accountId });
  },

  // Verify QR token
  verifyQRToken: async (token: string): Promise<any> => {
    return post('/workers/qr/verify', { token });
  },

  // Process payment via QR
  processQRPayment: async (token: string, amount: number): Promise<any> => {
    return post('/workers/qr/deposit', { token, amount });
  },
};
```

---

## Database Models

### 1. Worker Model - Bank Accounts

```javascript
// Fields in bankAccountSchema:
{
  accountNumber: String,
  accountHolderName: String,
  bankName: String,
  ifscCode: String,
  balance: Number,           // Current balance
  monthlyIncome: Number,     // Monthly total
  balanceLastUpdated: Date,  // Last update timestamp
  isDefault: Boolean,        // Default account
  isVerified: Boolean        // Account verification
}
```

### 2. UPI Transaction Model

Tracks all payments:
```javascript
{
  txId: String,              // Unique transaction ID
  workerId: ObjectId,        // Receiving worker
  amount: Number,            // Payment amount
  payerName: String,         // Payer name
  status: String,            // 'success', 'pending', 'failed'
  paymentMethod: String,     // 'QR_SCAN', 'UPI', etc.
  timestamp: Date,           // When payment occurred
  bankName: String,          // Which bank
  ifscCode: String           // IFSC code
}
```

---

## Complete User Flow

### Worker: Generate QR Code

```
1. Worker navigates to /worker/generate-qr
2. Selects bank account from list
3. Views account details:
   - Bank Name
   - Account Holder
   - Account Number (masked)
   - IFSC Code
4. Clicks "Generate QR Code"
5. API Call: POST /api/workers/qr/generate
   Request: { accountId: "..." }
   Response: {
     token: "base64-encoded-qr",
     qrCodeUrl: "https://api.qrserver.com/...",
     accountDetails: {...},
     expiresAt: "2025-12-28T16:02:00Z"
   }
6. QR code image displays
7. Can download, screenshot, or share URL
```

### Employer: Scan & Pay

```
1. Employer navigates to /scan-qr
2. Enters QR token (or scan physical QR)
3. Clicks "Verify QR"
4. API Call: POST /api/workers/qr/verify
   Request: { token: "base64-encoded-qr" }
   Response: {
     accountHolderName: "John Doe",
     bankName: "SBI",
     accountNumberMasked: "****1234",
     ifscCode: "SBIN0001234",
     isValid: true
   }
5. Recipient details display
6. Employer enters payment amount
7. Reviews:
   - Recipient name
   - Bank account info
   - Payment amount
8. Clicks "Pay"
9. API Call: POST /api/workers/qr/deposit
   Request: { token: "...", amount: 5000 }
   Response: {
     transactionId: "TXN-1234567-ABC",
     amount: 5000,
     newBalance: 15000,
     timestamp: "2025-12-27T16:02:00Z"
   }
10. Shows confirmation:
    - Transaction ID
    - Amount transferred
    - New account balance
    - Time of transaction
11. Option to make new payment
```

---

## Key Features of This System

### ✅ Security
- QR tokens expire after 24 hours
- Worker ID hash prevents fraud
- Account verification
- Audit trail logging
- Transaction IDs for tracking

### ✅ User Experience
- Simple QR scanning process
- Clear account information
- Real-time balance updates
- Transaction history
- Payment confirmation

### ✅ Data Integrity
- Transaction records
- Audit logs
- Balance tracking
- Monthly income calculation
- Worker earnings updates

### ✅ Simulation Features
- No real money movement
- Instant processing
- Multiple payments allowed
- Balance persistence
- Full transaction history

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/workers/qr/generate` | Generate QR code | Worker |
| POST | `/api/workers/qr/verify` | Verify QR token | Public |
| POST | `/api/workers/qr/deposit` | Process payment | Public |
| GET | `/api/workers/profile/bank-accounts` | List accounts | Worker |
| POST | `/api/workers/profile/bank-accounts` | Add account | Worker |

---

## Transaction Flow Diagram

```
WORKER                          SYSTEM                      PAYER
  │                               │                           │
  ├─ Select Account ──────────────>│                           │
  │                               │                           │
  ├─ Generate QR Code ───────────>│                           │
  │                      ┌────────┤                           │
  │                      │Generate │                          │
  │                      │Token    │                          │
  │<─ QR Code Returned ──┤         │                          │
  │                      └────────┤                           │
  │                               │                           │
  │                               │                      ┌────>
  │                               │                      │ Scan QR
  │                               │<─────QR Token────────┘
  │                               │                           │
  │                               ├─ Verify QR────────────────>
  │                               │                  Return Details
  │                               │<─────Recipient Info────────
  │                               │                           │
  │                               │<─ Payment Request────────┐ │
  │                               │   (Token + Amount)       │ │
  │                      ┌────────┤                          │ │
  │                      │Process │ Validate                │ │
  │                      │Payment │ Update Balance          │ │
  │                      │        │ Create Transaction      │ │
  │                      └────────┤                          │ │
  │<─ Update Balance ─────────────┤                          │ │
  │                               │ Send Confirmation ─────>┘ │
  │                               │                           │
  │                               └───────────────────────────┘
  │
Success - Payment Complete
```

---

## Testing the System

### Test Scenario 1: Basic Payment

```bash
# 1. Generate QR (as Worker)
curl -X POST http://localhost:5000/api/workers/qr/generate \
  -H "Authorization: Bearer WORKER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID"}'

Response:
{
  "token": "eyJhY2NvdW50SWQiOi4uLn0=",
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?...",
  ...
}

# 2. Verify QR (as Payer)
curl -X POST http://localhost:5000/api/workers/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhY2NvdW50SWQiOi4uLn0="}'

Response:
{
  "accountHolderName": "John Doe",
  "bankName": "SBI",
  "accountNumberMasked": "****1234",
  ...
}

# 3. Process Payment (as Payer)
curl -X POST http://localhost:5000/api/workers/qr/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhY2NvdW50SWQiOi4uLn0=",
    "amount": 5000,
    "payerName": "XYZ Company"
  }'

Response:
{
  "transactionId": "TXN-1234567-ABC",
  "amount": 5000,
  "newBalance": 15000,
  "timestamp": "2025-12-27T16:02:00Z"
}
```

### Test Scenario 2: Through UI

1. **Generate QR**:
   - Go to `/worker/generate-qr`
   - Select bank account
   - Click "Generate QR Code"

2. **Scan & Pay**:
   - Go to `/scan-qr`
   - Copy QR token from step 1
   - Paste in input field
   - Click "Verify QR"
   - Enter payment amount
   - Click "Pay"
   - See confirmation

---

## Balance & Income Tracking

### What Gets Updated

When payment is received:

```javascript
// Worker object
worker.balance += amount              // Total balance
worker.totalEarnings += amount        // Lifetime earnings

// Bank Account
account.balance += amount             // Account-specific balance
account.monthlyIncome += amount       // Current month income
account.balanceLastUpdated = now      // Last update time
```

### Viewing Balances

```typescript
// Frontend
const workerProfile = await wageService.getWorkerProfile();
console.log(workerProfile.bankAccounts[0].balance);     // Account balance
console.log(workerProfile.financialInfo.totalEarnings); // Lifetime earnings
```

---

## Next Steps to Implement

1. ✅ Backend payment endpoint - Already in place
2. ✅ Frontend scanning UI - Already in place
3. ✅ QR verification - Already in place
4. Enhance transaction history page to show QR payments
5. Add payment statistics/charts
6. Add email notifications for payments
7. Add real UPI integration (optional)

---

## Summary

The payment simulation system works by:

1. **Worker generates** a QR code containing bank account info
2. **Payer enters** the QR token on `/scan-qr`
3. **System verifies** the QR and shows recipient details
4. **Payer enters** payment amount
5. **System processes** payment (updates balances, creates transaction)
6. **Both see** confirmation with transaction ID and new balance

All data is persisted in the database, so:
- Balances are saved
- Transactions are recorded
- Monthly income is tracked
- Audit trail is maintained

This provides a complete simulation of online payment processing!
