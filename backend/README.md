# TRACIENT Backend - Mock UPI & QR Token Service

A lightweight Node.js/Express backend that provides QR token issuance and fake UPI payment simulation for the TRACIENT project.

## Features

- **QR Token Issuance** — Issues short-lived signed JWT tokens (5-minute TTL) for worker UPI QR codes
- **Token Verification** — Verifies tokens and returns worker account details
- **Mock UPI Receive** — Simulates UPI payment reception and logging
- **Worker Account Management** — Register and manage worker bank accounts (PoC)
- **Transaction History** — Fetch UPI transactions for workers
- **Blockchain Ready** — Prepared for integration with Hyperledger Fabric

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Authentication:** JWT (HS256)
- **Middleware:** CORS, Body Parser

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables (Optional)

Create a `.env` file (or use defaults):

```env
PORT=5000
JWT_SECRET=tracient-secret-key-change-in-production
```

### 3. Start the Server

```bash
npm start
```

Or for development (with auto-reload):

```bash
npm run dev
```## Pre-Registered Workers

The backend comes with **pre-registered worker accounts**. These workers must exist before they can generate QR codes or receive payments.

### Available Workers

| Worker Hash | Name | Phone | Bank Account | Balance |
|---|---|---|---|---|
| `aadhar-hash-001` | Rajesh Kumar | 9876543210 | TRCNT-0001-001 | 0 |
| `aadhar-hash-002` | Priya Singh | 9876543211 | TRCNT-0002-002 | 0 |
| `aadhar-hash-003` | Amit Patel | 9876543212 | TRCNT-0003-003 | 0 |

**Why Pre-Registration?**
- In production, workers must pass Aadhaar verification before registration
- The `workerHash` is a cryptographic hash of Aadhaar and is unique per worker
- Only registered workers can generate QR codes for payments
- This prevents unauthorized payment collection

### Adding New Workers (Development)

To add more workers, modify the `workerAccounts` object in `index.js`:

```javascript
const workerAccounts = {
  'new-hash-004': {
    name: 'New Worker Name',
    phone: '9876543214',
    bankAccount: 'TRCNT-0004-004',
    balance: 0,
    registered: true,
    registeredAt: new Date().toISOString(),
  },
};
```

Then update the mock auth service in `frontend/src/services/mockAuthService.ts` to use the same hash:

```typescript
'worker@gmail.com': {
  password: 'worker',
  user: {
    // ...
    idHash: 'new-hash-004', // Must match backend
  }
}
```



### QR Token Management

#### POST `/api/qr/issue`
Issues a signed JWT token for a worker's UPI QR code.

**Requirements:**
- Worker must be pre-registered in the system
- `workerHash` must match an existing worker's `idHash`

**Request:**
```json
{
  "workerHash": "aadhar-hash-001",
  "permanent": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "expiresIn": null,
  "permanent": true,
  "verifyUrl": "http://localhost:5000/verify?token=eyJhbGc...",
  "message": "QR token issued successfully (permanent)"
}
```

**Response (Worker Not Found):**
```json
{
  "error": "Worker not registered",
  "code": "WORKER_NOT_FOUND",
  "message": "Worker with hash aadhar-hash-999 is not registered in the system"
}
```

#### GET `/verify?token=<jwt>`
Verifies a QR token and returns worker details.

**Response:**
```json
{
  "success": true,
  "workerHash": "worker-hash-001",
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "bankAccount": "TRACIENT-001",
  "status": "verified"
}
```

### UPI Payments

#### POST `/api/upi/receive`
Receives a fake UPI payment.

**Request:**
```json
{
  "token": "eyJhbGc...",
  "amount": 500.00,
  "senderName": "Payer Name",
  "senderPhone": "9123456789",
  "transactionRef": "REF-2025-001"
}
```

**Response:**
```json
{
  "success": true,
  "txId": "UPI-A1B2C3D4",
  "status": "completed",
  "message": "Payment of ₹500 received successfully",
  "workerBalance": 5500.00
}
```

#### GET `/api/upi/transactions?workerHash=<hash>`
Fetches all UPI transactions for a worker.

**Response:**
```json
{
  "success": true,
  "workerHash": "worker-hash-001",
  "transactions": [
    {
      "txId": "UPI-A1B2C3D4",
      "workerHash": "worker-hash-001",
      "amount": 500.00,
      "senderName": "Payer",
      "timestamp": "2025-12-21T10:30:00Z",
      "status": "success"
    }
  ],
  "total": 1,
  "totalAmount": 500.00
}
```

### Worker Management

#### POST `/api/worker/register`
Registers a new worker account.

**Request:**
```json
{
  "workerHash": "worker-hash-002",
  "name": "Suresh Singh",
  "phone": "9987654321"
}
```

**Response:**
```json
{
  "success": true,
  "workerHash": "worker-hash-002",
  "bankAccount": "TRACIENT-WORKER",
  "message": "Worker registered successfully"
}
```

#### GET `/api/worker/:workerHash`
Fetches worker account details.

**Response:**
```json
{
  "success": true,
  "workerHash": "worker-hash-001",
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "bankAccount": "TRACIENT-001",
  "balance": 5500.00
}
```

### Health

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-21T10:30:00Z"
}
```

## Testing

### Using curl

```bash
# Issue a QR token
curl -X POST http://localhost:5000/api/qr/issue \
  -H "Content-Type: application/json" \
  -d '{"workerHash": "worker-hash-001"}'

# Verify the token
TOKEN="<token-from-issue>"
curl http://localhost:5000/verify?token=$TOKEN

# Simulate a UPI payment
curl -X POST http://localhost:5000/api/upi/receive \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN'",
    "amount": 500,
    "senderName": "Test Payer",
    "senderPhone": "9123456789"
  }'

# Fetch transactions
curl http://localhost:5000/api/upi/transactions?workerHash=worker-hash-001
```

### Using the Frontend

1. Start the backend: `npm start` (in `backend/` folder)
2. Start the frontend: `npm run dev` (in `frontend/` folder)
3. Login as a worker with the mock credentials
4. Navigate to "My UPI QR Code" page
5. Click "Generate QR Code"
6. Share the token or verification URL with testers
7. Simulate a payment using the API or a test client

## Integration with Blockchain (Future)

When integrating with Hyperledger Fabric:

1. After receiving a UPI payment, call the chaincode function:
   ```go
   RecordUPITransaction(txID, workerIDHash, amount, currency, senderName, senderPhone, transactionRef, paymentMethod)
   ```

2. Wait for the chaincode to return the block hash and number

3. Store the block reference in the payment record for audit trail

4. Update the worker's wage history on-chain

Example flow (pseudo-code):
```javascript
// 1. Receive UPI payment
const upiPayment = { token, amount, senderName, ... };

// 2. Verify token and get worker
const worker = verifyToken(upiPayment.token);

// 3. Submit to blockchain (integration stage)
const blockRef = await fabricClient.invokeChaincode('RecordUPITransaction', {
  txID: upiPayment.txId,
  workerIDHash: worker.hash,
  amount: upiPayment.amount,
  ...
});

// 4. Persist locally with block reference
await saveUPITransaction({ ...upiPayment, blockHash: blockRef.hash });
```

## Architecture Notes

### PoC Stage (Current)
- All data stored in-memory (volatile)
- No authentication/authorization on API
- Suitable for demo and testing

### Integration Stage
- Replace in-memory store with PostgreSQL/MongoDB
- Add request authentication (API keys or OAuth2)
- Integrate with Hyperledger Fabric chaincode
- Add proper error handling and logging
- Implement audit trails and compliance logging

### Production Stage
- Deploy on Kubernetes or serverless
- Add rate limiting and DDoS protection
- Implement comprehensive logging (ELK stack)
- Add monitoring and alerting (Prometheus/Grafana)
- Implement backup and disaster recovery
- Security hardening (HTTPS, secrets management, etc.)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test with the provided curl examples
4. Submit a PR

## License

Part of the TRACIENT project (Group 6).
