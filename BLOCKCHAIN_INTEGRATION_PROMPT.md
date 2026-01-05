# TRACIENT Blockchain-Backend-Frontend Integration Prompt

**Date:** January 3, 2026  
**Status:** Ready for Full Integration  
**Project:** TRACIENT - Blockchain-Based Income Traceability System

---

## 🎯 Executive Summary

This document provides a comprehensive, error-free integration plan to connect the TRACIENT Hyperledger Fabric blockchain network with the Node.js backend and React frontend. All components exist but need proper wiring and testing.

---

## 📊 Current State Analysis

### ✅ Completed Components

#### 1. Blockchain Infrastructure (80% Complete)
- ✅ Hyperledger Fabric chaincode with 24 functions (`blockchain/chaincode/tracient/chaincode.go`)
- ✅ Network deployment scripts (PowerShell + Bash)
- ✅ Test network with 6 containers (2 peers, 1 orderer, 3 CAs)
- ✅ Channel: `mychannel` | Chaincode: `tracient`
- ✅ Identity and Access Management (IAM) with attribute-based access control
- ✅ Comprehensive test scripts (`test-chaincode.sh/ps1`)

**Key Chaincode Functions Available:**
```go
// Wage Management (9 functions)
- RecordWage(wageID, workerHash, employerHash, amount, currency, jobType, timestamp, policyVersion)
- ReadWage(wageID)
- QueryWagesByWorker(workerHash)
- QueryWagesByEmployer(employerHash)
- CalculateTotalIncome(workerHash, startDate, endDate)
- GetWorkerIncomeHistory(workerHash, startDate, endDate)
- BatchRecordWages(wages[])

// UPI Transactions (4 functions)
- RecordUPITransaction(txID, workerHash, amount, senderName, timestamp)
- ReadUPITransaction(txID)
- QueryUPITransactionsByWorker(workerHash)

// User Management (5 functions)
- RegisterUser(userID, userHash, role, orgID, name)
- GetUser(userHash)
- UpdateUserStatus(userHash, status)
- ListUsersByRole(role)

// Poverty Status (3 functions)
- CheckPovertyStatus(workerHash, state, startDate, endDate)
- SetPovertyThreshold(state, category, amount)
- GetPovertyThreshold(state, category)

// Anomaly Detection (3 functions)
- FlagAnomaly(wageID, anomalyScore, reason, flaggedBy)
- ResolveAnomaly(wageID, resolution, resolvedBy)
- GetPendingAnomalies()
```

#### 2. Backend Infrastructure (60% Complete)
- ✅ Node.js Express API with TypeScript support
- ✅ MongoDB models: Worker, Employer, WageRecord, UPITransaction, Family
- ✅ Fabric Gateway configuration (`backend/config/fabric.js`)
- ✅ Fabric service layer (`backend/services/fabric.service.js`)
- ✅ Blockchain routes (`backend/routes/blockchain.routes.js`)
- ✅ Controllers with blockchain integration hooks
- ✅ JWT authentication with role-based access control
- ⚠️ Fabric packages installed: `@hyperledger/fabric-gateway`, `@grpc/grpc-js`

**Existing Backend Services:**
```javascript
// backend/services/fabric.service.js
- initBlockchain()
- recordWagePayment(wageData)
- registerWorkerOnChain(workerData)
- getWorkerWageHistory(workerIdHash)
- updateWorkerClassification(workerIdHash, category, annualIncome)
- recordVerification(verificationData)
```

#### 3. Frontend Infrastructure (40% Complete)
- ✅ React + TypeScript with Vite
- ✅ Role-based dashboards (Worker, Employer, Government, Admin)
- ✅ API service layer (`frontend/src/services/`)
- ❌ No blockchain-specific UI components yet
- ❌ No transaction verification UI

---

## 🔧 Integration Requirements

### Phase 1: Backend-Blockchain Connection (Priority: CRITICAL)

#### 1.1 Environment Configuration
**File:** `backend/.env`
```env
# Blockchain Configuration
FABRIC_ENABLED=true
FABRIC_CHANNEL=mychannel
FABRIC_CHAINCODE=tracient
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.org1.example.com

# Crypto Material Paths (relative to backend directory)
FABRIC_CRYPTO_PATH=../blockchain/network/test-network/organizations
FABRIC_USER_NAME=User1@org1.example.com

# Connection Settings
FABRIC_TIMEOUT_SHORT=5000
FABRIC_TIMEOUT_MEDIUM=15000
FABRIC_TIMEOUT_LONG=60000

# Development Mode
FABRIC_MOCK_MODE=false  # Set to true for testing without blockchain
```

#### 1.2 Update Fabric Configuration
**File:** `backend/config/fabric.js`

**Required Changes:**
1. Update certificate paths to match actual network structure
2. Add connection retry logic (network might not be ready)
3. Implement connection pooling for performance
4. Add health check endpoint

```javascript
// Enhanced connection with retry logic
export const initFabricGateway = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      // Check if network is ready
      const networkStatus = await checkNetworkHealth();
      if (!networkStatus.healthy) {
        throw new Error('Network not ready');
      }
      
      // Load credentials with proper paths
      const credentials = await loadCredentials();
      if (!credentials) {
        throw new Error('Credentials not found');
      }
      
      // Create gateway connection...
      // [existing connection code]
      
      logger.info('Fabric Gateway connected successfully');
      return contract;
    } catch (error) {
      logger.warn(`Connection attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};

// Add network health check
const checkNetworkHealth = async () => {
  try {
    const response = await fetch('http://localhost:7051/healthz');
    return { healthy: response.ok };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};
```

#### 1.3 Enhance Fabric Service
**File:** `backend/services/fabric.service.js`

**Add Missing Functions:**

```javascript
/**
 * Batch record multiple wage payments (for bulk uploads)
 */
export const batchRecordWages = async (wagesArray) => {
  try {
    const wagePayloads = wagesArray.map(wage => ({
      wageId: wage.referenceNumber,
      workerHash: wage.workerIdHash,
      employerHash: wage.employerIdHash,
      amount: wage.amount.toString(),
      currency: 'INR',
      jobType: wage.description || 'labor',
      timestamp: wage.initiatedAt || new Date().toISOString(),
      policyVersion: '2025-Q4'
    }));
    
    const result = await submitTransaction(
      'BatchRecordWages',
      JSON.stringify(wagePayloads)
    );
    
    logger.info('Batch wages recorded on blockchain', { count: wagesArray.length });
    return { success: true, count: wagesArray.length, result };
  } catch (error) {
    logger.error('Failed to batch record wages:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Query worker's income history with date range
 */
export const getWorkerIncomeHistory = async (workerIdHash, startDate, endDate) => {
  try {
    const result = await evaluateTransaction(
      'GetWorkerIncomeHistory',
      workerIdHash,
      startDate,
      endDate
    );
    
    return { success: true, data: JSON.parse(result) };
  } catch (error) {
    logger.error('Failed to get income history:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Check poverty status (BPL/APL) from blockchain
 */
export const checkPovertyStatus = async (workerIdHash, state = 'DEFAULT', startDate, endDate) => {
  try {
    const result = await evaluateTransaction(
      'CheckPovertyStatus',
      workerIdHash,
      state,
      startDate,
      endDate
    );
    
    return { success: true, data: JSON.parse(result) };
  } catch (error) {
    logger.error('Failed to check poverty status:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Record UPI transaction on blockchain
 */
export const recordUPITransaction = async (upiData) => {
  try {
    const { txId, workerIdHash, amount, senderName, senderPhone, timestamp } = upiData;
    
    const result = await submitTransaction(
      'RecordUPITransaction',
      JSON.stringify({
        txId,
        workerHash: workerIdHash,
        amount: amount.toString(),
        currency: 'INR',
        senderName,
        senderPhone: senderPhone || '',
        transactionRef: txId,
        timestamp: timestamp || new Date().toISOString(),
        paymentMethod: 'UPI'
      })
    );
    
    logger.info('UPI transaction recorded on blockchain', { txId, workerIdHash });
    return { success: true, txId, result };
  } catch (error) {
    logger.error('Failed to record UPI transaction:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get network status and health
 */
export const getNetworkStatus = async () => {
  try {
    if (!contract) {
      return {
        connected: false,
        channel: null,
        chaincode: null,
        error: 'Not initialized'
      };
    }
    
    // Try a simple query to verify connection
    await evaluateTransaction('InitLedger'); // Safe query
    
    return {
      connected: true,
      channel: FABRIC_CONFIG.channelName,
      chaincode: FABRIC_CONFIG.chaincodeName,
      mspId: FABRIC_CONFIG.mspId,
      endpoint: FABRIC_CONFIG.peerEndpoint
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

/**
 * Verify a transaction exists on blockchain
 */
export const verifyTransaction = async (transactionId) => {
  try {
    const result = await evaluateTransaction('ReadWage', transactionId);
    return {
      verified: true,
      data: JSON.parse(result),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      verified: false,
      error: error.message
    };
  }
};
```

#### 1.4 Update Wage Controller
**File:** `backend/controllers/wage.controller.js`

**Enhanced Integration:**

```javascript
// Line ~75: After creating wage record in MongoDB
// Record on blockchain (if enabled)
if (isBlockchainEnabled()) {
  try {
    const blockchainResult = await recordWagePayment({
      workerId: worker._id,
      workerIdHash: resolvedWorkerIdHash,
      employerId: employer?._id.toString() || 'SELF_DECLARED',
      employerIdHash: employer?.idHash || 'SELF_DECLARED',
      amount: amount,
      referenceNumber: referenceNumber,
      timestamp: wageRecord.initiatedAt.toISOString()
    });
    
    if (blockchainResult.success) {
      // Update MongoDB record with blockchain info
      wageRecord.blockchainTxId = blockchainResult.txHash;
      wageRecord.syncedToBlockchain = true;
      wageRecord.verifiedOnChain = true;
      await wageRecord.save();
      
      logger.info('Wage synced to blockchain', {
        wageId: wageRecord._id,
        txHash: blockchainResult.txHash
      });
    } else {
      // Log error but don't fail the transaction
      wageRecord.blockchainSyncError = blockchainResult.error;
      wageRecord.syncedToBlockchain = false;
      await wageRecord.save();
      
      logger.error('Failed to sync wage to blockchain', {
        wageId: wageRecord._id,
        error: blockchainResult.error
      });
    }
  } catch (error) {
    logger.error('Blockchain sync error:', error);
    wageRecord.blockchainSyncError = error.message;
    await wageRecord.save();
  }
} else {
  logBlockchainSkip('RecordWage in createWagePayment', logger);
}
```

#### 1.5 Create Blockchain Sync Service
**New File:** `backend/services/blockchain-sync.service.js`

```javascript
/**
 * Blockchain Synchronization Service
 * Handles periodic sync of pending transactions
 */
import { WageRecord } from '../models/index.js';
import { recordWagePayment, batchRecordWages } from './fabric.service.js';
import { logger } from '../utils/logger.util.js';

/**
 * Sync all pending wages to blockchain
 */
export const syncPendingWages = async () => {
  try {
    // Find all wages not synced to blockchain
    const pendingWages = await WageRecord.find({
      syncedToBlockchain: false,
      status: 'completed',
      blockchainSyncError: { $exists: false }
    }).limit(50); // Process in batches
    
    if (pendingWages.length === 0) {
      logger.info('No pending wages to sync');
      return { synced: 0 };
    }
    
    logger.info(`Syncing ${pendingWages.length} pending wages to blockchain`);
    
    // Use batch operation for efficiency
    const result = await batchRecordWages(pendingWages);
    
    if (result.success) {
      // Update all records
      await WageRecord.updateMany(
        { _id: { $in: pendingWages.map(w => w._id) } },
        { 
          syncedToBlockchain: true,
          verifiedOnChain: true
        }
      );
      
      logger.info(`Successfully synced ${pendingWages.length} wages`);
      return { synced: pendingWages.length };
    } else {
      logger.error('Batch sync failed:', result.error);
      return { synced: 0, error: result.error };
    }
  } catch (error) {
    logger.error('Sync service error:', error);
    return { synced: 0, error: error.message };
  }
};

/**
 * Retry failed syncs
 */
export const retryFailedSyncs = async () => {
  try {
    const failedWages = await WageRecord.find({
      syncedToBlockchain: false,
      blockchainSyncError: { $exists: true }
    }).limit(20);
    
    if (failedWages.length === 0) {
      return { retried: 0 };
    }
    
    logger.info(`Retrying ${failedWages.length} failed syncs`);
    
    let successCount = 0;
    for (const wage of failedWages) {
      try {
        const result = await recordWagePayment({
          workerIdHash: wage.workerIdHash,
          employerId: wage.employerId?.toString(),
          amount: wage.amount,
          referenceNumber: wage.referenceNumber,
          timestamp: wage.initiatedAt.toISOString()
        });
        
        if (result.success) {
          wage.syncedToBlockchain = true;
          wage.verifiedOnChain = true;
          wage.blockchainTxId = result.txHash;
          wage.blockchainSyncError = undefined;
          await wage.save();
          successCount++;
        }
      } catch (error) {
        logger.error(`Failed to retry sync for ${wage._id}:`, error);
      }
    }
    
    return { retried: successCount };
  } catch (error) {
    logger.error('Retry service error:', error);
    return { retried: 0, error: error.message };
  }
};

export default {
  syncPendingWages,
  retryFailedSyncs
};
```

#### 1.6 Add Cron Job for Auto-Sync
**File:** `backend/server.js`

```javascript
import cron from 'node-cron';
import { syncPendingWages, retryFailedSyncs } from './services/blockchain-sync.service.js';

// Sync pending wages every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Running blockchain sync job...');
  const result = await syncPendingWages();
  logger.info('Sync job completed', result);
});

// Retry failed syncs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('Running retry failed syncs job...');
  const result = await retryFailedSyncs();
  logger.info('Retry job completed', result);
});
```

---

### Phase 2: Frontend-Backend-Blockchain Integration

#### 2.1 Create Blockchain Service Layer
**New File:** `frontend/src/services/blockchainService.ts`

```typescript
import { get, post } from './api';

export interface BlockchainStatus {
  connected: boolean;
  channel: string | null;
  chaincode: string | null;
  error?: string;
}

export interface TransactionDetails {
  verified: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
}

export interface WageHistoryItem {
  wageId: string;
  amount: number;
  employerHash: string;
  timestamp: string;
  jobType: string;
}

/**
 * Get blockchain network status
 */
export const getBlockchainStatus = async (): Promise<BlockchainStatus> => {
  const response = await get<{ success: boolean; data: { status: BlockchainStatus } }>('/blockchain/status');
  return response.data.status;
};

/**
 * Verify a transaction on blockchain
 */
export const verifyTransaction = async (transactionId: string): Promise<TransactionDetails> => {
  const response = await get<{ success: boolean; data: TransactionDetails }>(`/blockchain/transaction/${transactionId}`);
  return response.data;
};

/**
 * Get worker's wage history from blockchain
 */
export const getWorkerWageHistory = async (idHash: string, startDate?: string, endDate?: string): Promise<WageHistoryItem[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await get<{ success: boolean; data: WageHistoryItem[] }>(`/blockchain/worker/${idHash}/history?${params}`);
  return response.data;
};

/**
 * Get poverty status from blockchain
 */
export const getPovertyStatus = async (idHash: string, state?: string): Promise<any> => {
  const params = state ? `?state=${state}` : '';
  const response = await get<{ success: boolean; data: any }>(`/blockchain/worker/${idHash}/poverty-status${params}`);
  return response.data;
};

/**
 * Trigger manual sync of pending transactions
 */
export const triggerBlockchainSync = async (): Promise<{ synced: number }> => {
  const response = await post<{ success: boolean; data: { synced: number } }>('/blockchain/sync', {});
  return response.data;
};

export const blockchainService = {
  getBlockchainStatus,
  verifyTransaction,
  getWorkerWageHistory,
  getPovertyStatus,
  triggerBlockchainSync
};

export default blockchainService;
```

#### 2.2 Create Blockchain Status Component
**New File:** `frontend/src/components/common/BlockchainStatus.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { Badge } from './Badge';

export const BlockchainStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await blockchainService.getBlockchainStatus();
        setStatus(data);
      } catch (error) {
        setStatus({ connected: false, error: 'Failed to fetch' });
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Activity className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Checking blockchain...</span>
      </div>
    );
  }

  if (!status || !status.connected) {
    return (
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">Blockchain Offline</span>
        {status?.error && (
          <Badge variant="danger" className="text-xs">{status.error}</Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="h-4 w-4 text-green-500" />
      <span className="text-sm text-green-600">Blockchain Connected</span>
      <Badge variant="success" className="text-xs">{status.chaincode}</Badge>
    </div>
  );
};
```

#### 2.3 Add Transaction Verification Badge
**New File:** `frontend/src/components/common/VerificationBadge.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { Badge } from './Badge';

interface VerificationBadgeProps {
  transactionId: string;
  showDetails?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  transactionId, 
  showDetails = false 
}) => {
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      try {
        const result = await blockchainService.verifyTransaction(transactionId);
        setVerification(result);
      } catch (error) {
        setVerification({ verified: false, error: 'Verification failed' });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [transactionId]);

  if (loading) {
    return (
      <Badge variant="default" className="text-xs">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Verifying...
      </Badge>
    );
  }

  if (verification?.verified) {
    return (
      <Badge variant="success" className="text-xs">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Verified on Chain
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="text-xs">
      <ShieldX className="h-3 w-3 mr-1" />
      Not Verified
    </Badge>
  );
};
```

#### 2.4 Update Worker Dashboard with Blockchain Data
**File:** `frontend/src/pages/worker/Dashboard.tsx`

Add blockchain wage history display:

```typescript
import { blockchainService } from '@/services/blockchainService';
import { VerificationBadge } from '@/components/common/VerificationBadge';
import { BlockchainStatus } from '@/components/common/BlockchainStatus';

// Add to component
const [blockchainHistory, setBlockchainHistory] = useState([]);
const [showBlockchainView, setShowBlockchainView] = useState(false);

useEffect(() => {
  const fetchBlockchainHistory = async () => {
    try {
      const history = await blockchainService.getWorkerWageHistory(workerIdHash);
      setBlockchainHistory(history);
    } catch (error) {
      console.error('Failed to fetch blockchain history:', error);
    }
  };

  if (showBlockchainView) {
    fetchBlockchainHistory();
  }
}, [showBlockchainView, workerIdHash]);

// Add toggle button
<Button 
  variant="outline" 
  onClick={() => setShowBlockchainView(!showBlockchainView)}
>
  {showBlockchainView ? 'Show Database View' : 'Show Blockchain View'}
</Button>

// Display blockchain status
<BlockchainStatus />

// In wage history table, add verification badges
{wages.map(wage => (
  <tr key={wage._id}>
    <td>{wage.referenceNumber}</td>
    <td>{formatCurrency(wage.amount)}</td>
    <td>
      <VerificationBadge transactionId={wage.blockchainTxId || wage.referenceNumber} />
    </td>
  </tr>
))}
```

---

### Phase 3: Testing & Validation

#### 3.1 Pre-Integration Checklist

**Blockchain Network:**
- [ ] Run `cd blockchain && ./start-network.ps1` (Windows) or `./start-network.sh` (WSL)
- [ ] Verify 6 containers running: `docker ps`
- [ ] Test chaincode: `./test-chaincode.ps1` or `./test-chaincode.sh`
- [ ] Verify channel: `mychannel` exists
- [ ] Verify chaincode: `tracient` is deployed

**Backend:**
- [ ] Install dependencies: `cd backend && npm install`
- [ ] Update `.env` with blockchain configuration
- [ ] Test Fabric connection: Create a test endpoint
- [ ] Start server: `npm run dev`
- [ ] Check logs for "Fabric Gateway connected successfully"

**Frontend:**
- [ ] Install dependencies: `cd frontend && npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Test API connection to backend

#### 3.2 Integration Test Script
**New File:** `backend/tests/blockchain-integration.test.js`

```javascript
import { initBlockchain, recordWagePayment, getWorkerWageHistory } from '../services/fabric.service.js';
import { expect } from 'chai';

describe('Blockchain Integration Tests', () => {
  before(async () => {
    // Initialize blockchain connection
    await initBlockchain();
  });

  it('should connect to Fabric network', async () => {
    const status = await getNetworkStatus();
    expect(status.connected).to.be.true;
  });

  it('should record a wage payment', async () => {
    const testWage = {
      workerIdHash: 'test-worker-123',
      employerIdHash: 'test-employer-123',
      amount: 1000,
      referenceNumber: 'TEST-' + Date.now(),
      timestamp: new Date().toISOString()
    };

    const result = await recordWagePayment(testWage);
    expect(result.success).to.be.true;
    expect(result.txHash).to.exist;
  });

  it('should retrieve wage history', async () => {
    const result = await getWorkerWageHistory('test-worker-123');
    expect(result.success).to.be.true;
    expect(result.data).to.be.an('array');
  });
});
```

**Run Test:**
```bash
cd backend
npm test
```

#### 3.3 Manual Testing Workflow

**Step 1: Create a Worker**
```bash
POST /api/auth/register
{
  "name": "Test Worker",
  "email": "worker@test.com",
  "phone": "9876543210",
  "aadhaar": "123456789012",
  "password": "Test@1234",
  "role": "worker"
}
```

**Step 2: Record a Wage (as Employer)**
```bash
POST /api/wages
{
  "workerIdHash": "<worker-id-hash>",
  "amount": 5000,
  "paymentMethod": "upi",
  "description": "Construction work"
}
```

**Step 3: Verify on Blockchain**
```bash
GET /api/blockchain/status
GET /api/blockchain/transaction/<transaction-id>
GET /api/blockchain/worker/<worker-hash>/history
```

**Step 4: Check Frontend**
- Login as worker
- Navigate to wage history
- Verify "Verified on Chain" badge appears
- Check blockchain status indicator

---

## 🚨 Critical Error Prevention

### Common Issues & Solutions

#### Issue 1: "Fabric packages not installed"
**Solution:**
```bash
cd backend
npm install @hyperledger/fabric-gateway @grpc/grpc-js
```

#### Issue 2: "Cannot find crypto material"
**Solution:**
```bash
# Verify path in .env matches actual location
ls ../blockchain/network/test-network/organizations/peerOrganizations

# Update FABRIC_CRYPTO_PATH if needed
FABRIC_CRYPTO_PATH=../blockchain/network/test-network/organizations
```

#### Issue 3: "Connection timeout"
**Solution:**
```bash
# 1. Check Docker containers
docker ps

# 2. Restart network if needed
cd blockchain
./fresh-start.ps1  # Windows
./fresh-start.sh   # Linux/WSL

# 3. Verify peer is accessible
curl http://localhost:7051/healthz
```

#### Issue 4: "Transaction failed: chaincode not found"
**Solution:**
```bash
# Redeploy chaincode
cd blockchain
./deploy-chaincode.ps1  # Windows
./deploy-chaincode.sh   # Linux/WSL
```

#### Issue 5: "MongoDB record saved but blockchain sync failed"
**This is expected!** The system is designed to work offline.
- Transaction saved in MongoDB
- Background job will retry sync every 5 minutes
- Manual retry: POST /api/blockchain/sync

---

## 📝 Implementation Checklist

### Backend Tasks
- [ ] Update `.env` with Fabric configuration
- [ ] Enhance `config/fabric.js` with retry logic
- [ ] Add missing functions to `services/fabric.service.js`
- [ ] Update `controllers/wage.controller.js` with blockchain sync
- [ ] Create `services/blockchain-sync.service.js`
- [ ] Add cron jobs to `server.js`
- [ ] Add health check endpoint: `GET /api/blockchain/health`
- [ ] Update blockchain routes with missing endpoints
- [ ] Write integration tests

### Frontend Tasks
- [ ] Create `services/blockchainService.ts`
- [ ] Create `components/common/BlockchainStatus.tsx`
- [ ] Create `components/common/VerificationBadge.tsx`
- [ ] Update worker dashboard with blockchain view toggle
- [ ] Update employer dashboard with sync status
- [ ] Add blockchain status to admin dashboard
- [ ] Add transaction verification modal
- [ ] Update wage history table with verification badges

### Testing Tasks
- [ ] Start blockchain network
- [ ] Test backend connection
- [ ] Test wage recording end-to-end
- [ ] Test verification badges in frontend
- [ ] Test sync service with intentional network failure
- [ ] Load test: 100 concurrent wage recordings
- [ ] Security test: Unauthorized access attempts

### Deployment Tasks
- [ ] Document environment variables
- [ ] Create startup scripts (start backend + blockchain)
- [ ] Add monitoring for blockchain connection
- [ ] Set up alerts for sync failures
- [ ] Create backup strategy for MongoDB + blockchain data

---

## 🎓 Key Integration Principles

1. **Graceful Degradation:** System works even if blockchain is down
2. **Async First:** Never block user transactions waiting for blockchain
3. **Eventual Consistency:** MongoDB is source of truth, blockchain is audit trail
4. **Retry Logic:** Failed syncs automatically retry
5. **Monitoring:** Always show blockchain connection status
6. **Performance:** Use batch operations for bulk uploads

---

## 📚 Reference Documentation

- **Blockchain Functions:** `blockchain/README.md`
- **Setup Guide:** `blockchain/BLOCKCHAIN_SETUP_GUIDE.md`
- **Backend API:** `backend/routes/blockchain.routes.js`
- **Chaincode Source:** `blockchain/chaincode/tracient/chaincode.go`
- **Project Plan:** `details/project_execution_plan.md`

---

## 🔗 Quick Start Integration

**1. Start Everything:**
```powershell
# Terminal 1: Start blockchain (PowerShell)
cd blockchain
.\start-network.ps1

# Terminal 2: Start backend
cd backend
npm install
npm run dev

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

**2. Verify Integration:**
```bash
# Check blockchain status
curl http://localhost:5000/api/blockchain/status

# Should return:
# { "connected": true, "channel": "mychannel", "chaincode": "tracient" }
```

**3. Test Transaction:**
- Login as employer
- Record a wage payment
- Check MongoDB: Record should have `syncedToBlockchain: true`
- Check frontend: "Verified on Chain" badge should appear

---

## ✅ Success Criteria

Integration is complete when:
- ✅ Blockchain network runs successfully
- ✅ Backend connects to Fabric without errors
- ✅ Wage payments sync to blockchain automatically
- ✅ Frontend shows verification badges
- ✅ Background sync job runs every 5 minutes
- ✅ System works gracefully when blockchain is offline
- ✅ All tests pass
- ✅ Documentation is updated

---

**Ready to integrate? Follow this document step-by-step. Each section is designed to be implemented independently without breaking existing functionality.**
