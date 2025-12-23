/**
 * TRACIENT Backend Server
 * Production-ready Express.js application
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { connectDB } from './config/database.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { defaultLimiter } from './middleware/rateLimit.middleware.js';
import logger from './utils/logger.util.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'tracient-secret-key-change-in-production';
const QR_TTL_SECONDS = 300; // 5 minutes

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// QR TOKEN ENDPOINTS
// ============================================================================

/**
 * POST /api/qr/issue
 * Issues a signed JWT token for a worker's UPI QR code
 * Token encodes: workerHash, issuedAt, expiresAt (optional)
 * Body: { workerHash, permanent: boolean }
 * Response: { token, expiresIn, verifyUrl }
 * 
 * NOTE: Worker must be pre-registered in the system before issuing QR
 */
app.post('/api/qr/issue', async (req, res) => {
  try {
    const { workerHash, permanent } = req.body;

    if (!workerHash) {
      return res.status(400).json({ error: 'workerHash is required' });
    }

    // Check if worker is registered in database
    const worker = await Worker.findOne({ idHash: workerHash });
    if (!worker) {
      return res.status(404).json({ 
        error: 'Worker not registered', 
        code: 'WORKER_NOT_FOUND',
        message: `Worker with hash ${workerHash} is not registered in the system` 
      });
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    
    // If permanent=true, no expiry; otherwise 5-minute TTL
    const ttlSeconds = permanent ? null : QR_TTL_SECONDS;
    const expiresAt = ttlSeconds ? issuedAt + ttlSeconds : null;

    const payload = {
      workerHash,
      issuedAt,
      permanent: Boolean(permanent),
      jti: uuidv4(), // Unique token ID for single-use tracking
    };

    if (expiresAt) {
      payload.exp = expiresAt;
    }

    const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });

    res.json({
      success: true,
      token,
      expiresIn: expiresAt ? ttlSeconds : null,
      permanent: Boolean(permanent),
      verifyUrl: `http://localhost:${PORT}/verify?token=${token}`,
      message: `QR token issued successfully${permanent ? ' (permanent)' : ' (expires in 5 minutes)'}`,
    });
  } catch (error) {
    console.error('Error issuing QR token:', error);
    res.status(500).json({ error: 'Failed to issue QR token' });
  }
});

/**
 * GET /verify
 * Verifies a QR token and returns worker information
 * Query: ?token=<jwt>
 * Response: { workerHash, name, bankAccount, status }
 */
app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'token query parameter is required' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired', code: 'EXPIRED' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token', code: 'INVALID' });
      }
      throw err;
    }

    const { workerHash } = payload;
    const worker = await Worker.findOne({ idHash: workerHash });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Log verification (audit trail)
    console.log(`[VERIFY] Token verified for worker: ${workerHash}`);

    res.json({
      success: true,
      workerHash,
      name: worker.name,
      phone: worker.phone,
      bankAccount: worker.bankAccount,
      status: 'verified',
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// ============================================================================
// FAKE UPI ENDPOINTS
// ============================================================================

/**
 * POST /api/upi/receive
 * Simulates receiving a UPI payment
 * Body: { token, amount, senderName, senderPhone, transactionRef }
 * Response: { success, txId, status, message }
 * 
 * In PoC: logs to memory; in integration: submits to blockchain chaincode
 */
app.post('/api/upi/receive', async (req, res) => {
  try {
    const { token, amount, senderName, senderPhone, senderUPI, transactionRef } = req.body;

    if (!token || !amount || !senderName) {
      return res.status(400).json({ error: 'token, amount, and senderName are required' });
    }

    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired QR token', code: 'INVALID_QR' });
    }

    const { workerHash } = payload;
    const worker = await Worker.findOne({ idHash: workerHash });

    if (!worker) {
      return res.status(404).json({ error: 'Worker account not found' });
    }

    // Create UPI transaction record
    const txId = `UPI-${uuidv4().substring(0, 8).toUpperCase()}`;

    const transaction = new UPITransaction({
      txId,
      workerHash,
      workerName: worker.name,
      workerAccount: worker.bankAccount,
      amount: parseFloat(amount),
      senderName,
      senderPhone,
      senderUPI,
      transactionRef: transactionRef || 'N/A',
      status: 'success',
      mode: 'UPI',
    });

    // Save transaction and update worker balance
    await transaction.save();
    worker.balance += parseFloat(amount);
    await worker.save();

    console.log(`[UPI] Transaction received: ${txId} for ${workerHash} (₹${amount})`);

    res.json({
      success: true,
      txId,
      status: 'completed',
      message: `Payment of ₹${amount} received successfully`,
      workerBalance: worker.balance,
      // In integration: would also have { blockHash, blockNumber } from chaincode
    });
  } catch (error) {
    console.error('Error processing UPI payment:', error);
    res.status(500).json({ error: 'Failed to process UPI payment' });
  }
});

/**
 * GET /api/upi/transactions
 * Fetches all UPI transactions for a worker
 * Query: ?workerHash=<hash>
 * Response: { transactions: [...] }
 */
app.get('/api/upi/transactions', async (req, res) => {
  try {
    const { workerHash } = req.query;

    if (!workerHash) {
      return res.status(400).json({ error: 'workerHash query parameter is required' });
    }

    const txs = await UPITransaction.find({ workerHash }).sort({ timestamp: -1 });

    const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      success: true,
      workerHash,
      transactions: txs,
      total: txs.length,
      totalAmount,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// ============================================================================
// WORKER ACCOUNT ENDPOINTS
// ============================================================================

/**
 * POST /api/worker/register
 * Registers a new worker account or updates existing worker
 * Body: { workerHash, name, phone, bankAccount }
 * 
 * Note: In production, this should be restricted and require backend verification
 * Only pre-approved workers should be registrable
 */
app.post('/api/worker/register', async (req, res) => {
  try {
    const { workerHash, name, phone } = req.body;

    if (!workerHash || !name) {
      return res.status(400).json({ error: 'workerHash and name are required' });
    }

    // Check if worker already exists
    let worker = await Worker.findOne({ idHash: workerHash });

    if (worker) {
      return res.status(409).json({ error: 'Worker already registered' });
    }

    // Create new worker
    worker = new Worker({
      idHash: workerHash,
      name,
      phone: phone || 'N/A',
      bankAccount: `TRACIENT-${workerHash.substring(0, 6).toUpperCase()}`,
      balance: 0,
    });

    await worker.save();

    console.log(`[REGISTER] Worker registered: ${workerHash}`);

    res.json({
      success: true,
      workerHash,
      bankAccount: worker.bankAccount,
      message: 'Worker registered successfully',
    });
  } catch (error) {
    console.error('Error registering worker:', error);
    res.status(500).json({ error: 'Failed to register worker' });
  }
});

/**
 * GET /api/worker/:workerHash
 * Gets worker account details
 */
app.get('/api/worker/:workerHash', async (req, res) => {
  try {
    const { workerHash } = req.params;
    const worker = await Worker.findOne({ idHash: workerHash });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({
      success: true,
      workerHash: worker.idHash,
      name: worker.name,
      phone: worker.phone,
      bankAccount: worker.bankAccount,
      balance: worker.balance,
      registered: worker.registered,
      registeredAt: worker.registeredAt,
    });
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║     TRACIENT Backend - Mock UPI & QR Token Service            ║
╠════════════════════════════════════════════════════════════════╣
║ Server running at: http://localhost:${PORT}                      ║
║ Health check: GET http://localhost:${PORT}/health                ║
║ Issue QR: POST http://localhost:${PORT}/api/qr/issue             ║
║ Verify QR: GET http://localhost:${PORT}/verify?token=<token>    ║
║ UPI Receive: POST http://localhost:${PORT}/api/upi/receive       ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
