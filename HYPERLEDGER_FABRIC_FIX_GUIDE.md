# Hyperledger Fabric Installation Fix Guide

## Problem
When running `npm start` in the backend, you see:
```
warn: Hyperledger Fabric packages not installed - using mock implementation
```

This means the Node.js packages for Fabric are not installed in the backend.

---

## Solution Overview

You need to:
1. Install Hyperledger Fabric SDK packages
2. Set up the Fabric network (using WSL/Docker)
3. Enable Fabric integration in backend
4. Test the connection

---

## Step 1: Install Hyperledger Fabric Node.js Packages

### For Windows (in PowerShell or Command Prompt):

```bash
cd backend

# Install Fabric SDK packages
npm install @hyperledger/fabric-gateway @grpc/grpc-js
```

**Expected output:**
```
added X packages, and audited XXX packages in XXs
```

Verify the installation:
```bash
npm list @hyperledger/fabric-gateway @grpc/grpc-js
```

---

## Step 2: Set Up Hyperledger Fabric Network

The Fabric network requires **WSL (Windows Subsystem for Linux)** and **Docker**.

### Prerequisites Check:
```bash
# Run in PowerShell
wsl --list --verbose           # Check WSL status
docker --version              # Need Docker 4.28+
```

### Quick Network Setup (5-10 minutes):

**Option A: Automatic Setup (Recommended)**

```bash
# In WSL terminal
cd /mnt/c/Users/nevrp/OneDrive/majorproject/tracient/blockchain
bash ./start-network.sh
```

Wait 2-3 minutes for all containers to start. You'll see:
```
✓ Network started
✓ Channel created
✓ Chaincode deployed
```

**Option B: Manual Setup**

```bash
# In WSL terminal
cd /mnt/c/Users/nevrp/OneDrive/majorproject/tracient/blockchain/network/test-network

# Clean previous setup
./network.sh down

# Start fresh network with chaincode
./network.sh up createChannel -ca -c mychannel
export CC_NAME=tracient
export CC_PATH=../../chaincode/tracient
./network.sh deployCC -c mychannel -ccn $CC_NAME -ccp $CC_PATH -ccl go
```

### Verify Network is Running:

```bash
# In WSL terminal
docker ps

# Expected: 6 containers running
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - ca_org1
# - ca_org2
# - ca_orderer
```

---

## Step 3: Enable Fabric in Backend Configuration

### Update `.env` file in backend:

```bash
# backend/.env

# Enable Fabric integration
FABRIC_ENABLED=true

# Fabric Network Configuration
FABRIC_CHANNEL_NAME=mychannel
FABRIC_CHAINCODE_NAME=tracient
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=localhost:7051
FABRIC_PEER_HOST_ALIAS=peer0.org1.example.com

# Path to network credentials
FABRIC_CRYPTO_PATH=../blockchain/network/test-network/organizations
FABRIC_WALLET_PATH=./fabric-wallet
FABRIC_USER_ID=appUser

# Network Path
FABRIC_NETWORK_PATH=../blockchain/network/test-network
```

### Update backend code to initialize Fabric on startup:

In `backend/server.js`, add Fabric initialization after database connection:

```javascript
import { initFabricGateway } from './config/fabric.js';

// ... existing MongoDB connection code ...

// Initialize Fabric Gateway
try {
  if (process.env.FABRIC_ENABLED === 'true') {
    const fabricStatus = await initFabricGateway();
    if (fabricStatus) {
      logger.info('✓ Hyperledger Fabric Gateway initialized');
    } else {
      logger.warn('⚠ Fabric not available - using mock mode');
    }
  }
} catch (error) {
  logger.error('Fabric initialization error:', error);
}
```

---

## Step 4: Test the Connection

### Start Backend Server:

```bash
cd backend
npm start
```

**Expected output:**
```
✓ MongoDB Connected: ac-dbla6tj-shard-00-02.biv9qa6.mongodb.net
✓ Hyperledger Fabric Gateway initialized
✓ Server running on port 5000
```

No warning = Fabric packages loaded successfully ✓

### Test Blockchain Endpoint:

```bash
# In PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/blockchain/status" -Method GET
$response.Content
```

**Expected response:**
```json
{
  "success": true,
  "fabricAvailable": true,
  "networkStatus": "active",
  "channel": "mychannel",
  "chaincode": "tracient"
}
```

---

## Step 5: Verify with Sample Transactions

### Create a Wage Record in Blockchain:

```powershell
$body = @{
    workerIdHash = "worker-001"
    employerId = "employer-001"
    amount = 5000
    currency = "INR"
    jobType = "construction"
    date = (Get-Date).ToUniversalTime().ToString("o")
    policyVersion = "2025-Q4"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/blockchain/record-wage" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Docker not running** | Start Docker Desktop, then run `docker ps` in WSL |
| **Port conflicts** | Stop network: `cd blockchain/network/test-network && ./network.sh down` |
| **WSL not installed** | Download: https://learn.microsoft.com/en-us/windows/wsl/install |
| **npm install fails** | Try: `npm install --no-optional` then `npm install @hyperledger/fabric-gateway` |
| **Permission denied in WSL** | Run: `sudo usermod -aG docker $USER` then logout/login |
| **Chaincode build error** | Run in WSL: `cd blockchain/chaincode/tracient && go mod tidy` |

---

## Quick Reference Commands

```bash
# Start Fabric network (in WSL)
cd /mnt/c/Users/nevrp/OneDrive/majorproject/tracient/blockchain
bash ./start-network.sh

# Stop Fabric network (in WSL)
cd blockchain/network/test-network
./network.sh down

# Install Node packages (in PowerShell, from backend folder)
npm install @hyperledger/fabric-gateway @grpc/grpc-js

# Start backend with Fabric enabled
cd backend
$env:FABRIC_ENABLED="true"
npm start

# Check network status
docker ps

# Check logs
docker logs peer0.org1.example.com
docker logs orderer.example.com
```

---

## Files Modified/Created

- ✓ `backend/.env` - Enable FABRIC_ENABLED
- ✓ `backend/package.json` - Fabric packages added (via npm install)
- ✓ `backend/server.js` - Initialize Fabric on startup
- ✓ `blockchain/network/test-network/` - Running Fabric network

---

## Next Steps

1. ✅ Install packages: `npm install @hyperledger/fabric-gateway @grpc/grpc-js`
2. ✅ Start Fabric network in WSL
3. ✅ Update `.env` file
4. ✅ Restart backend: `npm start`
5. ✅ Test blockchain endpoints

**Expected Result:** No more "Fabric packages not installed" warning ✓

