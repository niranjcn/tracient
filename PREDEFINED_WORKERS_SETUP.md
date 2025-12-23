# Predefined Workers Setup - Architecture Update

## Summary

The system has been updated to use **predefined, pre-registered workers** instead of dynamically generated worker hashes. This aligns with the real-world scenario where workers must be formally registered and verified before they can receive payments.

## Key Changes

### 1. Frontend Changes
**File:** `frontend/src/pages/worker/QRPage.tsx`
- Changed from generating `workerHash` dynamically based on user email
- Now uses the user's `idHash` (Aadhaar hash) assigned at login
- The `idHash` must match a pre-registered worker in the backend

**File:** `frontend/src/services/mockAuthService.ts`
- Updated worker account in mock auth to use `idHash: 'aadhar-hash-001'`
- This matches the pre-registered worker in the backend
- Only workers with matching hashes between frontend and backend can generate QR codes

### 2. Backend Changes
**File:** `backend/index.js`
- Replaced dynamic worker accounts with predefined registered workers
- Workers indexed by `idHash` (Aadhaar hash):
  - `aadhar-hash-001`: Rajesh Kumar
  - `aadhar-hash-002`: Priya Singh
  - `aadhar-hash-003`: Amit Patel
- Added validation in `/api/qr/issue` to check if worker exists before issuing QR

### 3. Documentation Updates
**Files:** 
- `frontend/MOCK_LOGIN_CREDENTIALS.md` - Updated with worker registration info
- `backend/README.md` - Added predefined workers table and registration guidelines

## Architecture

```
┌─ Frontend Login ─┐
│ worker@gmail.com │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Mock Auth Service (mockAuthService.ts)       │
│ Returns user with idHash: 'aadhar-hash-001'  │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ QR Page (QRPage.tsx)                         │
│ Extracts user.idHash = 'aadhar-hash-001'     │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ POST /api/qr/issue                           │
│ { workerHash: 'aadhar-hash-001' }            │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ Backend Validation                           │
│ Checks if workerHash exists in               │
│ workerAccounts['aadhar-hash-001']            │
└────────┬─────────────────────────────────────┘
         │
    ✓ Found
         │
         ▼
┌──────────────────────────────────────────────┐
│ Issue JWT Token                              │
│ Token is permanent (no expiry)               │
│ Payload: { workerHash, permanent, jti, ... }│
└──────────────────────────────────────────────┘
```

## Testing

### Step 1: Login
- Email: `worker@gmail.com`
- Password: `worker`
- This assigns `idHash: 'aadhar-hash-001'` from mock auth

### Step 2: Navigate to QR Page
- Go to `/worker/qr-code`
- The component automatically uses `user.idHash`

### Step 3: Generate QR
- Click "Generate QR Code"
- Backend validates that `aadhar-hash-001` is registered
- If registered, issues JWT token
- If not registered, returns 404 with "Worker not registered" error

### Step 4: Test Payment
```powershell
# Copy the token from the QR page
$token = "your_token_here"

$body = @{
    token = $token
    senderName = "Test Payer"
    senderUPI = "payer@mockupi"
    amount = 500
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/upi/receive" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

## Pre-Registered Workers

| idHash | Name | Phone | Bank Account | Status |
|---|---|---|---|---|
| `aadhar-hash-001` | Rajesh Kumar | 9876543210 | TRCNT-0001-001 | Registered ✓ |
| `aadhar-hash-002` | Priya Singh | 9876543211 | TRCNT-0002-002 | Registered ✓ |
| `aadhar-hash-003` | Amit Patel | 9876543212 | TRCNT-0003-003 | Registered ✓ |

## Production Considerations

1. **Aadhaar Verification Required**
   - Workers must complete Aadhaar verification before `idHash` is generated
   - `idHash` is a cryptographic hash of the Aadhaar number
   - Same person cannot register twice (hash is unique)

2. **Worker Registration Flow**
   - User submits Aadhaar
   - Backend validates with UIDAI
   - Hash is computed and stored
   - Worker account is created in database
   - Only then can they generate QR codes

3. **Database Migration**
   - Current: In-memory `workerAccounts` object
   - Production: Replace with `SELECT * FROM workers WHERE idHash = ?` query
   - Enable proper indexing on `idHash` for performance

4. **Blockchain Integration**
   - When UPI payment is received, record on-chain via chaincode
   - Call `RecordUPITransaction()` after `/api/upi/receive` verification
   - Store `blockHash` in transaction record

## Files Modified

1. `frontend/src/pages/worker/QRPage.tsx` - Uses `user.idHash` instead of generating hash
2. `frontend/src/services/mockAuthService.ts` - Updated worker `idHash`
3. `frontend/src/components/WorkerQr.tsx` - Added error handling for unregistered workers
4. `backend/index.js` - Predefined workers, validation in `/api/qr/issue`
5. `frontend/MOCK_LOGIN_CREDENTIALS.md` - Documentation
6. `backend/README.md` - Added predefined workers section

## Error Handling

If a worker is not registered:

**Frontend Toast:**
```
"Worker account not registered. Please contact administrator."
```

**Backend Response (404):**
```json
{
  "error": "Worker not registered",
  "code": "WORKER_NOT_FOUND",
  "message": "Worker with hash aadhar-hash-999 is not registered in the system"
}
```

## Next Steps

1. Test the full flow with mock curl commands (see backend README)
2. Verify that unregistered workers cannot generate QR codes
3. Add database integration to replace in-memory worker store
4. Implement Hyperledger Fabric integration for transaction recording
5. Add real Aadhaar verification in production
