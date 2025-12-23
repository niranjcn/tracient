# Quick Test Guide - Predefined Workers

## What Changed?

**Before:** Workers were dynamically generated from email addresses (each login created a unique hash)  
**After:** Workers must be pre-registered with a fixed `idHash` (like Aadhaar hash in production)

## How to Test

### Prerequisites
- Backend running on port 5000: `cd backend && npm start`
- Frontend running on port 5173: `cd frontend && npm run dev`

### Test Flow

#### 1. Login
```
Email: worker@gmail.com
Password: worker
```
This logs in a worker with `idHash: 'aadhar-hash-001'` (pre-registered in backend)

#### 2. Go to QR Code Page
```
URL: http://localhost:5173/worker/qr-code
```

#### 3. Generate QR Code
- Click "Generate QR Code"
- ✓ Success: QR code appears with "✓ Permanent QR Code" badge
- ✗ Error: "Worker account not registered" → Backend doesn't have this worker

#### 4. Copy Token
- Find the "Token (for testing)" box
- Click the copy button

#### 5. Test Payment (PowerShell)
```powershell
$token = "PASTE_YOUR_TOKEN_HERE"

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

#### 6. Expected Success Response
```json
{
  "success": true,
  "txId": "UPI-XXXXXXXX",
  "status": "completed",
  "message": "Payment of ₹500 received successfully",
  "workerBalance": 500
}
```

### What to Verify

✓ Worker `aadhar-hash-001` (Rajesh Kumar) can generate QR  
✓ Each QR token is permanent (survives page refresh)  
✓ Payment increases worker balance  
✓ Transaction appears in history  
✓ Unregistered workers get "not registered" error  

## Pre-Registered Workers

| Login Email | idHash | Name | Can Generate QR? |
|---|---|---|---|
| worker@gmail.com | aadhar-hash-001 | Rajesh Kumar | ✓ Yes |
| (not in mock) | aadhar-hash-002 | Priya Singh | ✓ Yes (if added to mock auth) |
| (not in mock) | aadhar-hash-003 | Amit Patel | ✓ Yes (if added to mock auth) |

## Troubleshooting

### "Worker account not registered"
**Cause:** The `idHash` in mock auth doesn't match any worker in backend  
**Fix:** 
1. Check `mockAuthService.ts` - worker's `idHash`
2. Check `backend/index.js` - workerAccounts object
3. Make sure both have same `idHash`

### "Invalid or expired QR token"
**Cause:** Token has expired (5-minute TTL) or is invalid  
**Fix:** Generate a fresh QR code from the page (not from old commands)

### Token copy not working
**Cause:** Click the copy button in the token box  
**Fix:** Look for the copy icon button next to the token input field

## Files to Reference

- **Backend workers:** `backend/index.js` (lines 15-48)
- **Frontend user setup:** `frontend/src/services/mockAuthService.ts` (line 11: idHash)
- **QR page logic:** `frontend/src/pages/worker/QRPage.tsx` (lines 8-15)
- **Documentation:** `PREDEFINED_WORKERS_SETUP.md`

## Key Concept

```
Login → Gets user with idHash → QR page uses that idHash → 
Backend checks if idHash exists → Issues QR token if exists
```

The system now requires workers to be pre-registered, just like in production!
