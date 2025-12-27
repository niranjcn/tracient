# Payment Simulation System - Quick Testing Guide

## 🚀 System Status

- ✅ **Backend**: Running on `http://localhost:5000`
- ✅ **Frontend**: Running on `http://localhost:5173`
- ✅ **Database**: MongoDB connected
- ✅ **API Endpoints**: All active

---

## 📱 Testing Workflow

### Step 1: Generate QR Code (as Worker)

**Navigate to**: `/worker/generate-qr`

1. **Add Bank Account** (if not already added)
   - Fill in account details
   - Click "Add Account"

2. **Generate QR Code**
   - Select an existing bank account
   - Click "Generate QR Code"
   - You'll see:
     - QR code image (scannable)
     - QR token (base64 string)
     - Account details (masked)
     - Expiry time (24 hours)

3. **Copy QR Token**
   - Copy the token value
   - This is what you'll use to scan

---

### Step 2: Send Payment (as Employer/Payer)

**Navigate to**: `/scan-qr`

#### Option A: Camera Scanning
1. Click "Scan Camera" button
2. Allow camera permission when prompted
3. Point camera at QR code
4. Or click "Paste from Clipboard" and paste the token
5. Continue to Step 3

#### Option B: Manual Entry
1. Paste QR token directly in the textarea
2. Click "Verify QR Code"
3. Continue to Step 3

---

### Step 3: Verify Recipient Details

After QR verification, you'll see:

```
✓ QR Code Verified
━━━━━━━━━━━━━━━━━━━━━━━
Recipient Name: John Doe
Bank: SBI
Account Number: ****1234
IFSC Code: SBIN0001234
```

**Confirm all details match the intended recipient!**

---

### Step 4: Enter Payment Amount

1. Enter amount in rupees (₹)
2. Minimum: ₹1
3. No upper limit (but realistic values: ₹1 - ₹100,000)
4. Click "Send ₹Amount"

---

### Step 5: Confirmation & Receipt

You'll see:

```
✓ Payment Successful!

Transaction Receipt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Transaction ID:  TXN-1234567890-ABCD
Recipient:       John Doe
Bank Account:    SBI
Amount Sent:     ₹5,000.00
New Balance:     ₹15,000.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Test Scenarios

### Test 1: Basic Payment Flow
**Steps**: Generate QR → Scan → Verify → Pay → Confirm

**Expected**:
- ✓ QR code generates successfully
- ✓ QR verifies with correct details
- ✓ Payment processes without errors
- ✓ Transaction ID created
- ✓ Balance updated

**Success Criteria**: Transaction receipt shows correct amount and new balance

---

### Test 2: Camera vs Manual Entry
**Part A**: Use camera to scan QR code
**Part B**: Use clipboard paste for same QR code

**Expected**: Both methods produce identical results

**Success Criteria**: Recipient details match perfectly

---

### Test 3: Multiple Payments
**Steps**: 
1. Generate 1 QR code
2. Make 3 payments using same QR
3. Check balance updates

**Expected**:
- ✓ Each payment creates unique transaction ID
- ✓ Balance increases by each amount
- ✓ All payments recorded

**Success Criteria**: Final balance = initial + sum of all payments

---

### Test 4: Expired QR Code
**Steps**:
1. Generate QR code
2. Wait 24 hours (or modify expiry in code for testing)
3. Try to use expired QR

**Expected**: Error message "QR code has expired"

**Success Criteria**: System properly rejects expired tokens

---

### Test 5: Invalid Inputs
**Test Various Invalid Inputs**:

| Input | Expected |
|-------|----------|
| Invalid QR token | Error: "Invalid QR token format" |
| Empty amount | Error: "Please enter valid amount" |
| Negative amount | Error: "Amount must be > 0" |
| Unknown worker | Error: "Worker not found" |
| Unknown account | Error: "Bank account not found" |

**Success Criteria**: All errors handled gracefully with clear messages

---

## 📊 Verification Checks

### Check 1: Database Records
**MongoDB Query**:
```javascript
// View transaction
db.upitransactions.find({}).pretty()

// View worker balance
db.workers.findOne({}).pretty()

// View audit logs
db.auditlogs.find({action: "payment_received"}).pretty()
```

### Check 2: API Responses
**Generate QR**:
```bash
curl -X POST http://localhost:5000/api/workers/qr/generate \
  -H "Authorization: Bearer <WORKER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"accountId": "<ACCOUNT_ID>"}'
```

**Verify QR**:
```bash
curl -X POST http://localhost:5000/api/workers/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "<QR_TOKEN>"}'
```

**Process Payment**:
```bash
curl -X POST http://localhost:5000/api/workers/qr/deposit \
  -H "Content-Type: application/json" \
  -d '{"token": "<QR_TOKEN>", "amount": 5000}'
```

### Check 3: Browser Developer Tools
**Console Errors**: Should see no JavaScript errors
**Network Tab**: All API calls should return 200/201 status
**Application Tab**: No storage errors

---

## 🔍 Debugging Tips

### If QR doesn't generate:
1. Check worker account exists
2. Verify bank account added to worker
3. Check account ID is valid
4. Check backend logs for errors

### If QR doesn't verify:
1. Verify token is copied completely (no truncation)
2. Check token format is base64
3. Verify 24-hour expiry not exceeded
4. Check backend QR verification logs

### If payment doesn't process:
1. Verify QR is valid (step through verify first)
2. Check amount is valid (> 0)
3. Verify worker has bank account
4. Check backend payment processing logs
5. Verify database writes are successful

### Camera Issues:
1. Check browser permissions
2. Try HTTPS (required for getUserMedia)
3. Check device has camera
4. Try manual paste instead
5. Check browser console for permission errors

---

## 📝 Sample Test Data

### Worker Account
```json
{
  "name": "John Doe",
  "idHash": "abc123...",
  "phone": "9876543210",
  "bankAccounts": [{
    "accountNumber": "1234567890123456",
    "accountHolderName": "John Doe",
    "bankName": "SBI",
    "ifscCode": "SBIN0001234",
    "balance": 10000,
    "monthlyIncome": 45000
  }]
}
```

### QR Token Structure
```json
{
  "type": "payment",
  "workerIdHash": "abc123...",
  "accountId": "507f1f77bcf86cd799439011",
  "accountNumber": "1234567890123456",
  "accountHolder": "John Doe",
  "bankName": "SBI",
  "ifscCode": "SBIN0001234",
  "timestamp": "2025-12-27T16:02:00Z",
  "expiresAt": "2025-12-28T16:02:00Z"
}
```

---

## ✅ Checklist Before Going Live

- [ ] Test basic payment flow works
- [ ] Test multiple consecutive payments
- [ ] Test camera scanning (if available)
- [ ] Test manual token entry
- [ ] Test with different amounts
- [ ] Verify balances update correctly
- [ ] Check transaction records in database
- [ ] Test error messages for invalid inputs
- [ ] Verify audit logs are created
- [ ] Test profile page shows updated balance
- [ ] Test payment history shows transactions
- [ ] Verify QR expiry works (24 hours)
- [ ] Test with multiple worker accounts
- [ ] Load test (simulate multiple concurrent payments)
- [ ] Security review of QR token format
- [ ] Backup database before production

---

## 📚 Related Documentation

- [PAYMENT_SIMULATION_GUIDE.md](./PAYMENT_SIMULATION_GUIDE.md) - Detailed architecture and implementation
- [PAYMENT_IMPLEMENTATION_SUMMARY.md](./PAYMENT_IMPLEMENTATION_SUMMARY.md) - Complete feature list

---

## 🎯 Features Ready to Use

- ✅ QR code generation with bank account encoding
- ✅ QR code verification and decoding
- ✅ Payment processing with balance updates
- ✅ Transaction recording and audit trails
- ✅ Camera-based QR scanning with fallback
- ✅ Error handling and validation
- ✅ Real-time feedback and confirmations
- ✅ Responsive UI for desktop and mobile

---

**Questions?** Check the logs: `backend/logs/app.log` or browser console for detailed error messages.
