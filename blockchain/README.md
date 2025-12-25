# TRACIENT Blockchain Stack v2.0

**Blockchain-Based Income Traceability System for Equitable Welfare Distribution**

This repository contains the Hyperledger Fabric blockchain network and smart contracts (chaincode) for the TRACIENT project. The chaincode provides 24 functions for wage tracking, identity management, poverty status calculation, and compliance reporting.

## 🚀 Quick Start

### Prerequisites
- Windows 11 with WSL2 (Ubuntu 22.04)
- Docker Desktop 4.28+ with WSL 2 backend enabled
- Go 1.21+ installed in WSL
- Git

### One-Command Start
```bash
# From Windows PowerShell
.\start-network.ps1

# Or from WSL
./start-network.sh
```

That's it! The script will:
1. Start the Fabric network (6 containers)
2. Create the channel `mychannel`
3. Deploy the chaincode
4. Initialize the ledger with sample data

## 📁 Directory Structure

```
blockchain/
├── chaincode/
│   └── tracient/
│       ├── chaincode.go      # Smart contract with 24 functions
│       ├── go.mod
│       └── go.sum
├── network/
│   ├── bin/                  # Fabric binaries
│   ├── config/               # Fabric configuration
│   └── test-network/         # Fabric test network
├── start-network.sh          # Start network (bash)
├── start-network.ps1         # Start network (PowerShell)
├── restart-network.sh        # Restart without data loss
├── restart-network.ps1
├── deploy-chaincode.sh       # Deploy/upgrade chaincode
├── deploy-chaincode.ps1
├── fresh-start.sh            # Complete cleanup & restart
├── fresh-start.ps1
├── test-chaincode.sh         # Test all 24 functions
├── test-chaincode.ps1
├── set-env.sh                # Environment variables (source this)
├── install-go.sh             # Install Go in WSL
└── .gitignore
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `start-network.sh` | Start network with smart data preservation |
| `start-network.sh clean` | Fresh start (removes all data) |
| `restart-network.sh` | Restart containers (preserve data) |
| `deploy-chaincode.sh` | Deploy/upgrade chaincode only |
| `fresh-start.sh` | Complete cleanup and restart |
| `test-chaincode.sh` | Run comprehensive test suite |
| `test-chaincode.sh --quick` | Run essential tests only |
| `set-env.sh` | Source to set environment variables |
| `install-go.sh` | Install Go 1.21 in WSL |

**Windows Users:** Use `.ps1` versions (e.g., `.\start-network.ps1`)

## 📋 Chaincode Functions (24 Total)

### 🏗️ Initialization
| Function | Description |
|----------|-------------|
| `InitLedger` | Seed ledger with sample data and default thresholds |

### 💰 Wage Record Functions (9)
| Function | Description |
|----------|-------------|
| `RecordWage` | Record a new wage transaction |
| `ReadWage` | Get wage record by ID |
| `WageExists` | Check if wage exists |
| `QueryWageHistory` | Get transaction history for a wage |
| `QueryWagesByWorker` | Get all wages for a worker |
| `QueryWagesByEmployer` | Get all wages paid by employer |
| `CalculateTotalIncome` | Calculate total income in date range |
| `BatchRecordWages` | Record multiple wages at once |
| `GetWorkerIncomeHistory` | Get monthly income breakdown |

### 💳 UPI Transaction Functions (4)
| Function | Description |
|----------|-------------|
| `RecordUPITransaction` | Record UPI payment |
| `ReadUPITransaction` | Get UPI transaction by ID |
| `UPITransactionExists` | Check if UPI transaction exists |
| `QueryUPITransactionsByWorker` | Get all UPI transactions for worker |

### 👤 Identity Management Functions (5)
| Function | Description |
|----------|-------------|
| `RegisterUser` | Register new user with role |
| `GetUserProfile` | Get user profile |
| `UserExists` | Check if user exists |
| `UpdateUserStatus` | Update user status (admin only) |
| `VerifyUserRole` | Verify user has required role |

### 📊 Poverty Threshold Functions (3)
| Function | Description |
|----------|-------------|
| `SetPovertyThreshold` | Set BPL/APL threshold by state |
| `GetPovertyThreshold` | Get threshold for state/category |
| `CheckPovertyStatus` | Determine if worker is BPL or APL |

### 🚨 Anomaly Detection Functions (3)
| Function | Description |
|----------|-------------|
| `FlagAnomaly` | Flag suspicious wage record |
| `GetFlaggedWages` | Get wages above threshold score |
| `UpdateAnomalyStatus` | Update anomaly review status |

### 📈 Compliance Functions (1)
| Function | Description |
|----------|-------------|
| `GenerateComplianceReport` | Generate wage/fraud/employer reports |

## 🧪 Testing

### Run All Tests
```bash
./test-chaincode.sh
# or from PowerShell
.\test-chaincode.ps1
```

### Quick Test (Essential Functions)
```bash
./test-chaincode.sh --quick
```

### Manual Testing
```bash
# Set up environment
source ./set-env.sh

# Query a wage record
peer chaincode query -C mychannel -n tracient -c '{"function":"ReadWage","Args":["WAGE001"]}'

# Check poverty status
peer chaincode query -C mychannel -n tracient -c '{"function":"CheckPovertyStatus","Args":["worker-001","DEFAULT","2024-01-01","2025-12-31"]}'

# Register a new user
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles $ORG1_PEER_TLSROOTCERT --peerAddresses localhost:9051 --tlsRootCertFiles $ORG2_PEER_TLSROOTCERT -c '{"function":"RegisterUser","Args":["user123","user_hash_123","worker","Org1MSP","John Doe","contact_hash"]}'
```

## 🏛️ Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRACIENT Network                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Org1MSP   │  │   Org2MSP   │  │     Orderer         │ │
│  │             │  │             │  │                     │ │
│  │ peer0.org1  │  │ peer0.org2  │  │ orderer.example.com │ │
│  │ :7051       │  │ :9051       │  │ :7050               │ │
│  │             │  │             │  │                     │ │
│  │  ca.org1    │  │  ca.org2    │  │   ca.orderer        │ │
│  │  :7054      │  │  :8054      │  │   :9054             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Channel: mychannel                      │ │
│  │                                                          │ │
│  │    ┌─────────────────────────────────────────┐          │ │
│  │    │         Chaincode: tracient v2.0        │          │ │
│  │    │         24 Functions                    │          │ │
│  │    └─────────────────────────────────────────┘          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| `worker` | View own wages, check poverty status |
| `employer` | Record wages, view compliance reports |
| `government_official` | Set thresholds, update user status, view all |
| `bank_officer` | View UPI transactions, record payments |
| `auditor` | Generate compliance reports, view anomalies |
| `admin` | Full system access |

## 🛠️ Troubleshooting

### Chaincode not found
```bash
# Redeploy chaincode
./deploy-chaincode.sh
```

### Network not starting
```bash
# Check Docker is running
docker ps

# Fresh start
./fresh-start.sh
```

### Path errors in peer commands
```bash
# Always source environment first
source ./set-env.sh
# Then run peer commands from test-network directory
cd network/test-network
```

### Go not found
```bash
./install-go.sh
source ~/.bashrc
```

## 📝 API Examples

### Record Wage
```json
{
  "function": "RecordWage",
  "Args": [
    "WAGE123",           // wageID
    "worker_hash_001",   // workerIDHash
    "employer_hash_001", // employerIDHash
    "15000",             // amount
    "INR",               // currency
    "construction",      // jobType
    "2025-12-25T10:00:00Z", // timestamp
    "2025-Q4"            // policyVersion
  ]
}
```

### Check Poverty Status
```json
{
  "function": "CheckPovertyStatus",
  "Args": [
    "worker_hash_001",   // workerIDHash
    "Karnataka",         // state
    "2024-01-01",        // startDate
    "2024-12-31"         // endDate
  ]
}
```

**Response:**
```json
{
  "status": "BPL",
  "totalIncome": 28000,
  "threshold": 32000,
  "state": "Karnataka",
  "period": "2024-01-01 to 2024-12-31"
}
```

### Flag Anomaly
```json
{
  "function": "FlagAnomaly",
  "Args": [
    "WAGE123",           // wageID
    "0.92",              // anomalyScore
    "Amount exceeds typical range for job type",
    "ai_model_v2"        // flaggedBy
  ]
}
```

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Dec 2025 | Added 16 new functions, identity management, poverty thresholds |
| 1.0 | Nov 2025 | Initial release with 8 basic functions |

## 📚 Related Documentation

- [Blockchain Setup Guide](BLOCKCHAIN_SETUP_GUIDE.md)
- [Quick Start Guide](QUICK_START.md)
- [Startup Guide](STARTUP_GUIDE.md)
- [Usage Examples](USAGE.md)
- [Comprehensive Fix Prompt](COMPREHENSIVE_FIX_PROMPT.md)

## 📄 License

This project is part of the TRACIENT Major Project for B.Tech Computer Science.

---

**TRACIENT** - *Blockchain-Based Income Traceability System for Equitable Welfare Distribution*
