# Bank Account Management & QR Code Generation

## Overview
Workers and employers can now manage multiple bank accounts and generate QR codes based on specific bank accounts for payments.

## Features Implemented

### 1. Multiple Bank Accounts Support

#### Worker Model Updates
- Added `bankAccounts` array to store multiple bank account details
- Each bank account contains:
  - `accountNumber` (required)
  - `accountHolderName` (required)
  - `bankName` (required)
  - `ifscCode` (required)
  - `accountType` (savings/current/other, default: savings)
  - `isDefault` (boolean) - marks default account
  - `isVerified` (boolean) - verification status
  - `verifiedAt` (date) - when account was verified
  - `createdAt` (date) - when account was added

#### Employer Model Updates
- Same bank account structure as workers
- Default account type is 'current' for employers

### 2. Worker Bank Account Endpoints

#### GET /api/workers/profile/bank-accounts
Get all bank accounts for current worker
```bash
curl -X GET http://localhost:5000/api/workers/profile/bank-accounts \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bankAccounts": [
      {
        "_id": "123abc",
        "accountNumber": "0123456789012",
        "accountHolderName": "John Doe",
        "bankName": "HDFC Bank",
        "ifscCode": "HDFC0000001",
        "accountType": "savings",
        "isDefault": true,
        "isVerified": false,
        "createdAt": "2025-12-23T13:00:00Z"
      }
    ],
    "defaultAccount": { /* default account object */ }
  }
}
```

#### POST /api/workers/profile/bank-accounts
Add a new bank account
```bash
curl -X POST http://localhost:5000/api/workers/profile/bank-accounts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d {
    "accountNumber": "0123456789012",
    "accountHolderName": "John Doe",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0000001",
    "accountType": "savings",
    "isDefault": true
  }
```

#### PUT /api/workers/profile/bank-accounts/:accountId
Update a bank account
```bash
curl -X PUT http://localhost:5000/api/workers/profile/bank-accounts/123abc \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d {
    "accountHolderName": "John Doe Updated",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0000001"
  }
```

#### DELETE /api/workers/profile/bank-accounts/:accountId
Delete a bank account
```bash
curl -X DELETE http://localhost:5000/api/workers/profile/bank-accounts/123abc \
  -H "Authorization: Bearer <token>"
```

#### PUT /api/workers/profile/bank-accounts/:accountId/default
Set a bank account as default
```bash
curl -X PUT http://localhost:5000/api/workers/profile/bank-accounts/123abc/default \
  -H "Authorization: Bearer <token>"
```

### 3. Enhanced QR Code Generation

#### POST /api/upi/qr/generate
Generate QR code based on selected bank account
```bash
curl -X POST http://localhost:5000/api/upi/qr/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d {
    "workerIdHash": "5902ea3918c20c2ed7f9eff099101f4620aa6a28d14f5ec81c33f5eaecd3f231",
    "bankAccountId": "123abc",
    "amount": 5000,
    "validityMinutes": 5
  }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=MDEyMzQ1Njc4OTAxMnx...",
    "token": "MDEyMzQ1Njc4OTAxMnxIREZDMDAwMDAwMXw1OTAyZWEzOTE4YzIwYzJlZDdmOWVmZjA5OTEwMWY0NjIwYWE2YTI4ZDE0ZjVlYzgxYzMzZjVlYWVjZDNmMjMx|HDFC Bank",
    "expiresAt": "2025-12-23T13:05:00Z",
    "worker": {
      "name": "regw3",
      "idHash": "5902ea3918c20c2ed7f9eff099101f4620aa6a28d14f5ec81c33f5eaecd3f231",
      "maskedAadhaar": "****-****-1234"
    },
    "bankAccount": {
      "accountNumber": "0123****1234",
      "accountHolderName": "John Doe",
      "bankName": "HDFC Bank",
      "ifscCode": "HDFC0000001"
    },
    "amount": 5000
  }
}
```

## QR Code Data Structure

The QR code encodes the following data in base64:
```
{accountNumber}|{ifscCode}|{workerIdHash}|{bankName}
```

**Example:**
```
0123456789012|HDFC0000001|5902ea3918c20c2ed7f9eff099101f4620aa6a28d14f5ec81c33f5eaecd3f231|HDFC Bank
```

When encoded in base64:
```
MDEyMzQ1Njc4OTAxMnxIREZDMDAwMDAwMXw1OTAyZWEzOTE4YzIwYzJlZDdmOWVmZjA5OTEwMWY0NjIwYWE2YTI4ZDE0ZjVlYzgxYzMzZjVlYWVjZDNmMjMx|HDFC Bank
```

## How It Works

### For Workers:
1. Add one or more bank accounts via POST /api/workers/profile/bank-accounts
2. Set a default account or select a specific one for QR generation
3. Generate QR code via POST /api/upi/qr/generate with optional `bankAccountId`
4. If no `bankAccountId` provided, uses default account or first account

### For Employers:
1. Request worker's QR code with specific bank account:
   - Worker ID or Hash
   - Optional: specific bank account ID
   - Optional: fixed amount for payment
2. Receive QR code image URL and token
3. Scanner can validate the QR code before payment

### For Payments:
1. Employer/payer scans QR code
2. System validates the QR token
3. Extracts bank account details from QR token
4. Processes payment to the correct bank account
5. Records transaction with bank account reference

## Database Model Changes

### Worker.bankAccounts Schema
```javascript
{
  _id: ObjectId,
  accountNumber: String (required),
  accountHolderName: String (required),
  bankName: String (required),
  ifscCode: String (required),
  accountType: String (enum: ['savings', 'current', 'other']),
  isDefault: Boolean,
  isVerified: Boolean,
  verifiedAt: Date,
  createdAt: Date
}
```

### Employer.bankAccounts Schema
Same structure as Worker, with `accountType` defaulting to 'current'

## Security Considerations

1. **Account Number Masking**: API responses mask account numbers (show only last 4 digits)
2. **Verification Status**: Accounts should be verified before use in payments
3. **Default Account**: Prevents accidental use of wrong account
4. **QR Token Expiry**: Tokens expire after specified minutes (default: 5)
5. **Audit Logging**: All account operations are logged

## Next Steps

1. **Bank Account Verification**: Implement verification process (micro-transactions, OTP, etc.)
2. **Employer Bank Accounts**: Add similar endpoints for employer bank account management
3. **Payment Processing**: Update payment flow to use selected bank account
4. **Account Linking**: Implement bank API integration for real account validation
5. **Dynamic QR Generation**: Use actual QR code generation library instead of API service

## Related Files Modified

- `backend/models/Worker.js` - Added bankAccounts array
- `backend/models/Employer.js` - Added bankAccounts array
- `backend/routes/worker.routes.js` - Added bank account endpoints
- `backend/controllers/worker.controller.js` - Implemented bank account handlers
- `backend/controllers/upi.controller.js` - Enhanced QR generation with bank account selection
- `backend/routes/upi.routes.js` - Updated QR route permissions
