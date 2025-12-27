# QR Code Generation - API Documentation

## Endpoint: Generate QR Code

### Route
```
POST /api/workers/qr/generate
```

### Authentication
Required - Worker role (via Bearer token)

### Request Body
```json
{
  "accountId": "string (ObjectId of bank account)"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "token": "base64-encoded-qr-token",
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
    "verifyUrl": "http://localhost:5173/scan-qr?token=...",
    "accountDetails": {
      "accountNumber": "****1234",
      "accountHolder": "John Doe",
      "bankName": "State Bank of India",
      "ifscCode": "SBIN0001234"
    },
    "expiresAt": "2025-12-28T16:02:00Z"
  }
}
```

---

## QR Code Data Structure

The QR token encodes the following information:

```json
{
  "type": "payment",
  "workerIdHash": "hash-of-aadhaar",
  "accountId": "mongodb-objectid",
  "accountNumber": "1234567890123456",
  "accountHolder": "John Doe",
  "bankName": "State Bank of India",
  "ifscCode": "SBIN0001234",
  "timestamp": "2025-12-27T16:02:00Z",
  "expiresAt": "2025-12-28T16:02:00Z"
}
```

---

## How It Works

### 1. Worker Generates QR Code
- Navigate to `/worker/generate-qr`
- Select a bank account
- Click "Generate QR Code"
- The system creates a scannable QR code with account details

### 2. QR Code Content
The QR code contains:
- Worker ID Hash (for verification)
- Bank Account Number (masked in display)
- Account Holder Name
- Bank Name
- IFSC Code
- Timestamp (when created)
- Expiry Time (24 hours)

### 3. Employer/Admin Scans QR Code
- Scan the QR code using the app
- System decodes the account information
- Displays which account the payment will go to
- Shows account holder name and bank details

### 4. Payment Processing
- Employer/Admin confirms the account details
- Enters payment amount
- Processes the payment to the specified account

---

## Frontend Implementation

### GenerateQR Page
Located: `frontend/src/pages/worker/GenerateQR.tsx`

Features:
- Select from multiple bank accounts
- Display account details before generating QR
- Generate scannable QR code
- Display QR code image
- Copy token to clipboard
- Copy verification URL
- Download QR code
- Show account details alongside QR

### Service Method
```typescript
wageService.generateQRCode(accountId): Promise<QRGenerationResponse>
```

---

## Testing

### Using cURL
```bash
curl -X POST http://localhost:5000/api/workers/qr/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "ACCOUNT_ID_HERE"}'
```

### Using Frontend
1. Go to `/worker/generate-qr`
2. Select a bank account
3. Click "Generate QR Code"
4. QR code will be displayed

---

## Error Handling

### Missing Account ID
```json
{
  "success": false,
  "message": "Account ID is required"
}
```

### Account Not Found
```json
{
  "success": false,
  "message": "Bank account not found"
}
```

### Worker Not Found
```json
{
  "success": false,
  "message": "Worker not found"
}
```

---

## Security Considerations

1. **Token Encoding**: QR data is base64 encoded, not encrypted
2. **Expiry**: QR tokens expire after 24 hours
3. **Verification**: Worker ID Hash is included for verification
4. **Account Masking**: Full account number not displayed to users
5. **IFSC Code**: Included to identify exact bank branch

---

## File Changes Made

### Backend
- ✅ `backend/routes/worker.routes.js` - Added POST /workers/qr/generate route
- ✅ `backend/controllers/worker.controller.js` - Added generateQRForAccount method

### Frontend
- ✅ `frontend/src/services/wageService.ts` - Added generateQRCode method
- ✅ `frontend/src/pages/worker/GenerateQR.tsx` - Already implemented

---

## How to Use

### Step 1: Access Generate QR Page
Go to `/worker/generate-qr` from the sidebar menu

### Step 2: Select Bank Account
- Choose from your registered bank accounts
- View account details

### Step 3: Generate QR Code
- Click "Generate QR Code" button
- QR code image will appear
- Token will be displayed below

### Step 4: Share QR Code
Options:
- Display on screen for scanning
- Download as image
- Copy token to clipboard
- Share verification URL

### Step 5: Employers Scan
- Employers scan the QR code
- See which account it points to
- Proceed with payment

