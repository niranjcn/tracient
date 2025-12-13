# TRACIENT Blockchain Setup Guide
## Complete Command Reference & Explanations

**Project:** TRACIENT - Income Traceability System  
**Date Started:** December 10, 2025  
**Status:** ✅ Network Running | ⏳ Chaincode Pending  
**Environment:** Windows 11 + WSL2 (Ubuntu 22.04) + Docker Desktop 28.5.2

---

## Table of Contents
1. [Prerequisites Installation](#prerequisites-installation)
2. [Environment Setup](#environment-setup)
3. [Hyperledger Fabric Installation](#hyperledger-fabric-installation)
4. [Network Setup](#network-setup)
5. [Network Operations](#network-operations)
6. [What Happened Behind the Scenes](#what-happened-behind-the-scenes)
7. [Architecture Overview](#architecture-overview)
8. [Next Steps](#next-steps)

---

## Prerequisites Installation

### 1. WSL2 Ubuntu Installation
```powershell
# Run in PowerShell as Administrator
wsl --install -d Ubuntu-22.04
```
**Why:** Hyperledger Fabric requires a Linux environment. WSL2 provides native Linux kernel on Windows.

**What it does:**
- Installs Windows Subsystem for Linux version 2
- Downloads and installs Ubuntu 22.04 LTS
- Creates a Linux virtual machine with full kernel capabilities

---

### 2. Docker Desktop Configuration
```
Settings → Resources → WSL Integration
✅ Enable integration with Ubuntu-22.04
```
**Why:** Fabric runs in Docker containers. WSL integration allows Ubuntu to control Docker Desktop.

**What it does:**
- Exposes Docker daemon to WSL2
- Allows `docker` commands from Ubuntu terminal
- Shares Docker images/containers between Windows and WSL2

---

### 3. Go Installation (v1.25.4)
```bash
# Download and install Go
curl -OL https://go.dev/dl/go1.25.4.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.4.linux-amd64.tar.gz

# Add to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version
```
**Why:** Chaincode (smart contracts) can be written in Go. Also, some Fabric tools are built with Go.

**Output:** `go version go1.25.4 linux/amd64`

---

### 4. Node.js Installation (v18.20.8)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```
**Why:** Fabric SDK and some chaincode can use Node.js. Required for JavaScript/TypeScript smart contracts.

**Output:**
- `v18.20.8`
- `10.9.2`

---

### 5. Docker Permission Setup
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or newgrp)
newgrp docker

# Verify
docker ps
```
**Why:** By default, Docker requires root. This allows non-root users to run Docker commands.

**What it does:**
- Adds current user to `docker` group
- Grants permission to access Docker socket
- Eliminates need for `sudo docker`

---

### 6. Docker Credential Fix (WSL-specific)
```bash
# Create Docker config to disable Windows credential helper
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
  "credsStore": ""
}
EOF
```
**Why:** WSL tries to use Windows Docker Desktop credential helper, causing "exec format error".

**What it does:**
- Disables Windows credential store integration
- Allows Docker to work directly in WSL
- Fixes image pull/push authentication issues

---

## Environment Setup

### 7. Project Directory Structure
```bash
cd /mnt/e/Major-Project/blockchain
mkdir -p network
```
**Why:** Organize blockchain files separate from chaincode. `/mnt/e/` accesses Windows E: drive from WSL.

**Directory Purpose:**
- `blockchain/` - Root folder
- `blockchain/chaincode/` - Smart contracts
- `blockchain/network/` - Network configuration and binaries

---

## Hyperledger Fabric Installation

### 8. Download Fabric Install Script
```bash
cd ~
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh
```
**Why:** Official Fabric installation script downloads binaries, samples, and Docker images.

**What it does:**
- Downloads latest stable install script from GitHub
- Makes it executable with `chmod +x`

---

### 9. Install Fabric Components
```bash
./install-fabric.sh docker binary samples
```
**Why:** Installs all required Fabric components in one command.

**What it installs:**

| Component | Size | Purpose |
|-----------|------|---------|
| **fabric-samples** | 23.88 MiB | Example projects and test network |
| **Fabric binaries** | 119 MiB | CLI tools (peer, orderer, configtxgen, etc.) |
| **Fabric CA client** | 30 MiB | Certificate Authority client tool |
| **Docker images** | ~2 GB | peer, orderer, ccenv, baseos, ca images |

**Downloads:**
- Fabric v2.5.14
- Fabric CA v1.5.15
- All necessary Docker images from DockerHub

---

### 10. Configure PATH for Fabric Binaries
```bash
echo 'export PATH=$PATH:$HOME/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
peer version
```
**Why:** Allows running Fabric commands (peer, configtxgen) from any directory.

**Output:**
```
peer:
 Version: v2.5.14
 Commit SHA: 24767ba
 Go version: go1.25.2
 OS/Arch: linux/amd64
```

---

## Network Setup

### 11. Copy Network Files to Project
```bash
# Copy test-network scripts
cp -r ~/fabric-samples/test-network /mnt/e/Major-Project/blockchain/network/

# Copy binaries
cp -r ~/fabric-samples/bin /mnt/e/Major-Project/blockchain/network/

# Copy config files
cp -r ~/fabric-samples/config /mnt/e/Major-Project/blockchain/network/
```
**Why:** 
- Makes project self-contained
- Allows customization without affecting original samples
- Files accessible from both WSL and Windows/VS Code

**Copied Items:**
- `test-network/` - Network startup scripts, compose files
- `bin/` - All Fabric CLI tools
- `config/` - Default configuration templates (core.yaml, orderer.yaml)

---

### 12. Navigate to Test Network
```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
```
**Why:** All network commands must run from this directory.

---

### 13. Clean Previous Network (if any)
```bash
./network.sh down
```
**Why:** Ensures clean slate - removes old containers, volumes, crypto material.

**What it does:**
- Stops all Fabric containers
- Removes Docker volumes
- Deletes generated certificates
- Cleans up chaincode images

**Output (first run):**
```
Error: no such volume (normal - nothing to clean)
```

---

### 14. Start Network with Channel
```bash
export PATH=/mnt/e/Major-Project/blockchain/network/bin:$PATH
./network.sh up createChannel -ca -c mychannel
```
**This is the MAIN command!** Let's break it down:

**Parameters:**
- `up` - Start the network
- `createChannel` - Create a channel after network starts
- `-ca` - Use Certificate Authorities (production-grade crypto)
- `-c mychannel` - Channel name

**Why each flag:**
- **`-ca`**: Production mode - uses Fabric CA instead of cryptogen
  - More secure
  - Allows runtime identity management
  - Mimics real-world PKI infrastructure
  
- **`-c mychannel`**: Names the channel for organization communication
  - Channels are private "sub-chains" in Fabric
  - Different channels = different ledgers

---

## Network Operations

### What Happened During Startup (Detailed Breakdown)

#### **Phase 1: Certificate Authority Startup (0-42 seconds)**
```bash
docker-compose -f compose/compose-ca.yaml up -d
```
**Started 3 CA containers:**

| Container | Port | Purpose |
|-----------|------|---------|
| `ca_org1` | 7054 | Issues identities for Org1 members |
| `ca_org2` | 8054 | Issues identities for Org2 members |
| `ca_orderer` | 9054 | Issues identities for ordering service |

**Why CAs are needed:**
- Every participant needs a digital identity (certificate)
- CAs are "trusted authorities" that sign certificates
- Like a passport office for blockchain network

---

#### **Phase 2: Identity Enrollment (42-162 seconds)**

**For Org1:**
```bash
fabric-ca-client enroll -u https://admin:adminpw@localhost:7054
fabric-ca-client register --id.name peer0 --id.secret peer0pw --id.type peer
fabric-ca-client register --id.name user1 --id.secret user1pw --id.type client
fabric-ca-client register --id.name org1admin --id.secret org1adminpw --id.type admin
```

**Generated certificates for:**
1. **peer0** - The peer node's identity
2. **user1** - Application user identity
3. **org1admin** - Organization administrator

**Certificate types generated:**
- **MSP (Membership Service Provider)** - Identity certificates
  - Private key (ECDSA-256)
  - Public certificate (X.509)
  - CA root certificate
  
- **TLS certificates** - Secure communication
  - Server certificate
  - TLS CA certificate

**Storage location:**
```
organizations/
├── peerOrganizations/
│   ├── org1.example.com/
│   │   ├── peers/peer0.org1.example.com/
│   │   │   ├── msp/          # Identity certs
│   │   │   └── tls/          # TLS certs
│   │   └── users/
│   │       ├── Admin@org1.example.com/
│   │       └── User1@org1.example.com/
```

**Same process repeated for:**
- Org2 (peer0, user1, org2admin)
- Orderer Org (orderer, orderer2-4, ordererAdmin)

**Total identities created: 13**

---

#### **Phase 3: Network Node Startup (162-165 seconds)**
```bash
docker-compose -f compose/compose-test-net.yaml up -d
```

**Started 3 containers:**

| Container | Image | Ports | Purpose |
|-----------|-------|-------|---------|
| `orderer.example.com` | fabric-orderer:latest | 7050, 7053, 9443 | Orders transactions into blocks |
| `peer0.org1.example.com` | fabric-peer:latest | 7051, 9444 | Org1's ledger node |
| `peer0.org2.example.com` | fabric-peer:latest | 9051, 9445 | Org2's ledger node |

**Docker volumes created:**
- `compose_orderer.example.com` - Orderer's blockchain data
- `compose_peer0.org1.example.com` - Org1 peer's ledger
- `compose_peer0.org2.example.com` - Org2 peer's ledger

**Why these nodes:**
- **Orderer**: Ensures all peers see transactions in same order (consensus)
- **Peers**: Store ledger copies, execute chaincode, endorse transactions
- **2 Orgs**: Simulates multi-organization collaboration (like government + bank)

---

#### **Phase 4: Channel Creation (165-167 seconds)**
```bash
configtxgen -profile ChannelUsingRaft \
  -outputBlock ./channel-artifacts/mychannel.block \
  -channelID mychannel
```

**What happened:**
1. **Read configuration** from `configtx/configtx.yaml`
2. **Generated genesis block** for channel "mychannel"
3. **Set consensus** to Raft (crash fault tolerant)
4. **Defined members**: Org1MSP, Org2MSP, OrdererMSP

**Genesis block contains:**
- Channel configuration
- Organization definitions
- Ordering service configuration
- Access control policies

**Output:** `mychannel.block` (genesis block)

---

#### **Phase 5: Channel Submission (167-168 seconds)**
```bash
osnadmin channel join \
  --channelID mychannel \
  --config-block ./channel-artifacts/mychannel.block
```

**What happened:**
- Submitted genesis block to orderer via admin API (port 9443)
- Orderer validates and stores the block
- Channel becomes active

**Response:**
```json
{
  "name": "mychannel",
  "url": "/participation/v1/channels/mychannel",
  "consensusRelation": "consenter",
  "status": "active",
  "height": 1
}
```

**Channel height: 1** (only genesis block exists)

---

#### **Phase 6: Peers Join Channel (168-178 seconds)**

**Org1 peer joins:**
```bash
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=.../org1/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=.../org1/users/Admin@org1.example.com/msp

peer channel join -b ./channel-artifacts/mychannel.block
```

**Org2 peer joins:**
```bash
export CORE_PEER_ADDRESS=localhost:9051
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=.../org2/tlsca/tlsca.org2.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=.../org2/users/Admin@org2.example.com/msp

peer channel join -b ./channel-artifacts/mychannel.block
```

**What happened:**
- Each peer downloads the genesis block
- Peer verifies it's authorized to join
- Peer initializes local ledger with genesis block
- Peer starts gossip protocol to discover other peers

---

#### **Phase 7: Anchor Peer Configuration (178-202 seconds)**

**Why anchor peers?**
- Other organizations' peers discover the network through anchor peers
- Acts as entry point for cross-org communication
- Required for service discovery and private data collections

**For Org1:**
```bash
# 1. Fetch current channel config
peer channel fetch config config_block.pb

# 2. Decode to JSON
configtxlator proto_decode --input config_block.pb --type common.Block

# 3. Add anchor peer configuration
jq '.channel_group.groups.Application.groups.Org1MSP.values += 
  {"AnchorPeers": {
    "mod_policy": "Admins",
    "value": {"anchor_peers": [{"host": "peer0.org1.example.com", "port": 7051}]}
  }}'

# 4. Create update transaction
configtxlator compute_update --original original.pb --updated modified.pb

# 5. Submit update
peer channel update -f Org1MSPanchors.tx
```

**Same process for Org2** with peer0.org2.example.com:9051

**Channel updates:**
- Block 0: Genesis
- Block 1: Org1 anchor peer update
- Block 2: Org2 anchor peer update

**Final channel height: 3**

---

## What Happened Behind the Scenes

### Network Architecture Created

```
┌─────────────────────────────────────────────────────────────┐
│                    HYPERLEDGER FABRIC NETWORK                 │
│                         "mychannel"                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐          ┌──────────────────┐
│   Certificate    │          │   Certificate    │
│   Authority      │          │   Authority      │
│   ca_org1        │          │   ca_org2        │
│   Port: 7054     │          │   Port: 8054     │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │ Issues Certs                 │ Issues Certs
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│   Peer Node      │          │   Peer Node      │
│   peer0.org1     │◄────────►│   peer0.org2     │
│   Port: 7051     │  Gossip  │   Port: 9051     │
│                  │          │                  │
│ ┌──────────────┐ │          │ ┌──────────────┐ │
│ │   Ledger     │ │          │ │   Ledger     │ │
│ │  mychannel   │ │          │ │  mychannel   │ │
│ └──────────────┘ │          │ └──────────────┘ │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │        Transactions          │
         └──────────────┬───────────────┘
                        ▼
              ┌──────────────────┐
              │  Orderer Node    │
              │  orderer.example │
              │  Port: 7050      │
              │                  │
              │  Raft Consensus  │
              └──────────────────┘
                        ▲
                        │
              ┌──────────────────┐
              │   Certificate    │
              │   Authority      │
              │   ca_orderer     │
              │   Port: 9054     │
              └──────────────────┘
```

### Container Runtime Status

```bash
docker ps
```

**Output:**
```
CONTAINER ID   IMAGE                               PORTS                    NAMES
faeb4ae87ea2   hyperledger/fabric-orderer:latest   0.0.0.0:7050->7050/tcp   orderer.example.com
f82bc328aefb   hyperledger/fabric-peer:latest      0.0.0.0:9051->9051/tcp   peer0.org2.example.com
495b420b6bcb   hyperledger/fabric-peer:latest      0.0.0.0:7051->7051/tcp   peer0.org1.example.com
4c329d553603   hyperledger/fabric-ca:latest        0.0.0.0:9054->9054/tcp   ca_orderer
13b53e2c4f95   hyperledger/fabric-ca:latest        0.0.0.0:7054->7054/tcp   ca_org1
2857fb2b41e6   hyperledger/fabric-ca:latest        0.0.0.0:8054->8054/tcp   ca_org2
```

**Total: 6 running containers**

---

## Architecture Overview

### Hyperledger Fabric Components

| Component | Purpose | Analogy |
|-----------|---------|---------|
| **Peer** | Stores ledger, executes chaincode, endorses transactions | Bank branch with vault and teller |
| **Orderer** | Orders transactions, creates blocks, distributes to peers | Post office sorting mail by date |
| **Certificate Authority** | Issues digital identities (X.509 certificates) | Passport office issuing IDs |
| **Channel** | Private blockchain between organizations | Private WhatsApp group |
| **Chaincode** | Smart contract (business logic) | Automated contract enforcer |
| **Ledger** | Blockchain + world state database | Bank's transaction log + account balances |

### TRACIENT-Specific Roles

**For our project:**
- **Org1** = Government welfare department
- **Org2** = Verification agency / Bank
- **Orderer** = Neutral transaction ordering service
- **Channel "mychannel"** = Wage recording channel
- **TRACIENT Chaincode** = Wage recording and verification logic

---

## Chaincode Deployment

### Prerequisites Check
Before deploying chaincode, ensure:
- ✅ Network is running (`docker ps` shows 6 containers)
- ✅ Channel "mychannel" is active
- ✅ Both peers have joined the channel
- ✅ You're in the test-network directory

---

### Step 1: Package the Chaincode

**Command:**
```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
export PATH=/mnt/e/Major-Project/blockchain/network/bin:$PATH
export FABRIC_CFG_PATH=/mnt/e/Major-Project/blockchain/network/config

peer lifecycle chaincode package tracient.tar.gz \
  --path ../../chaincode/tracient \
  --lang golang \
  --label tracient_1.0
```

**What this does:**
- **package** - Creates a compressed archive (.tar.gz) of your chaincode
- **--path** - Points to your Go chaincode source directory
- **--lang golang** - Specifies the programming language (Go)
- **--label tracient_1.0** - Version label (format: name_version)

**Why packaging?**
- Chaincode must be in a specific format to install on peers
- Package includes source code + dependencies (from vendor/)
- Same package can be installed on multiple peers
- Label helps track different versions

**Output:**
```
(No output = success)
```

**Result:** Creates `tracient.tar.gz` in current directory

---

### Step 2: Install Chaincode on Org1 Peer

**Command:**
```bash
# Configure environment for Org1 Admin
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Install chaincode package
peer lifecycle chaincode install tracient.tar.gz
```

**What each environment variable does:**

| Variable | Value | Purpose |
|----------|-------|---------|
| `CORE_PEER_TLS_ENABLED` | true | Enable TLS for secure communication |
| `CORE_PEER_LOCALMSPID` | Org1MSP | Identifies which organization we're acting as |
| `CORE_PEER_TLS_ROOTCERT_FILE` | path/to/ca.crt | TLS certificate to verify peer's identity |
| `CORE_PEER_MSPCONFIGPATH` | path/to/Admin/msp | Admin's certificates for authorization |
| `CORE_PEER_ADDRESS` | localhost:7051 | Target peer's address |

**Why install?**
- Each peer needs its own copy of chaincode
- Peer compiles and stores chaincode locally
- Installation doesn't activate chaincode (that's the commit step)

**Output:**
```
2025-12-10 11:19:29.944 IST 0001 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Installed remotely: response:<status:200 payload:"\nMtracient_1.0:a229031ba21e3179137547e894f1ff052cecbfe2c0ee26f0013733afab7b3fb2\022\014tracient_1.0" >
2025-12-10 11:19:29.949 IST 0002 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: tracient_1.0:a229031ba21e3179137547e894f1ff052cecbfe2c0ee26f0013733afab7b3fb2
```

**Understanding the output:**
- **status:200** - HTTP success code, installation successful
- **Package ID:** `tracient_1.0:a229031ba21e3179137547e894f1ff052cecbfe2c0ee26f0013733afab7b3fb2`
  - Format: `label:SHA256_hash`
  - Hash ensures code integrity (any change = different hash)
  - This ID is used to reference the installed chaincode

**⚠️ IMPORTANT:** Copy and save this Package ID!

---

### Step 3: Install Chaincode on Org2 Peer

**Command:**
```bash
# Switch to Org2 Admin
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

# Install same package on Org2 peer
peer lifecycle chaincode install tracient.tar.gz
```

**Why Org2 also needs to install?**
- Fabric uses endorsement policy: transactions need approval from multiple orgs
- Each endorsing peer must have chaincode installed
- Both orgs verify transactions independently

**Output:**
```
2025-12-10 11:22:26.317 IST 0001 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Installed remotely: response:<status:200 payload:"\nMtracient_1.0:a229031ba21e3179137547e894f1ff052cecbfe2c0ee26f0013733afab7b3fb2\022\014tracient_1.0" >
2025-12-10 11:22:26.321 IST 0002 INFO [cli.lifecycle.chaincode] submitInstallProposal -> Chaincode code package identifier: tracient_1.0:a229031ba21e3179137547e894f1ff052cecbfe2c0ee26f0013733afab7b3fb2
```

**Notice:** Package ID is identical to Org1 (same chaincode, same hash)

---

### Step 4: Approve Chaincode for Org2

**Command:**
```bash
# Set Package ID variable
export CC_PACKAGE_ID=tracient_1.0:a229031ba21e3179137547e894f1ff052cecbfe2c0ee26f0013733afab7b3fb2

peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name tracient \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

**What this does:**
- **approveformyorg** - Org2 formally approves the chaincode definition
- **--channelID mychannel** - Approval specific to this channel
- **--name tracient** - Chaincode name (used in invoke/query)
- **--version 1.0** - Human-readable version
- **--package-id** - Links approval to installed package
- **--sequence 1** - First deployment (increment for upgrades)
- **-o localhost:7050** - Send approval to orderer

**Why approval is needed?**
- Fabric uses decentralized governance
- No single org can deploy chaincode unilaterally
- Each org must explicitly agree to chaincode definition
- Approval is recorded on blockchain

**Parameters explained:**

| Parameter | Value | Significance |
|-----------|-------|--------------|
| **--name** | tracient | Logical name for invoking chaincode |
| **--version** | 1.0 | Tracks chaincode evolution |
| **--sequence** | 1 | Increments with each update (1, 2, 3...) |
| **--package-id** | tracient_1.0:a229... | Specific code version being approved |

**Output:**
```
2025-12-10 11:37:25.474 IST 0001 INFO [chaincodeCmd] ClientWait -> txid [4abf4f068479a72bf8765cd8d044314aa4a45614decc524d5ad08dadd5becac6] committed with status (VALID) at localhost:9051
```

**Understanding the output:**
- **txid** - Transaction ID of approval (recorded on blockchain)
- **status (VALID)** - Approval transaction validated and committed
- **localhost:9051** - Confirmation from Org2's peer

**What happened on blockchain:**
- A new transaction was created with Org2's approval
- Orderer created a block containing this approval
- Block distributed to all peers
- Peers validated and committed the block

---

### Step 5: Approve Chaincode for Org1

**Command:**
```bash
# Switch to Org1 Admin
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name tracient \
  --version 1.0 \
  --package-id $CC_PACKAGE_ID \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
```

**Output:**
```
2025-12-10 11:37:43.982 IST 0001 INFO [chaincodeCmd] ClientWait -> txid [29f1e2cff4ce219790bfd9aea0ded84b0f2a59af04c58e2a0faf751b0db69c82] committed with status (VALID) at localhost:7051
```

**Why both orgs must approve?**
- Default channel policy requires majority approval
- For 2 orgs: both must approve (2/2 = majority)
- For 3 orgs: at least 2 must approve (2/3 = majority)
- Policy can be customized in channel configuration

---

### Step 6: Check Commit Readiness

**Command:**
```bash
peer lifecycle chaincode checkcommitreadiness \
  --channelID mychannel \
  --name tracient \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --output json
```

**What this does:**
- Queries which organizations have approved
- Checks if approval threshold is met
- Does NOT commit - just verifies readiness

**Output:**
```json
{
  "approvals": {
    "Org1MSP": true,
    "Org2MSP": true
  }
}
```

**Understanding the output:**
- **Org1MSP: true** - Org1 has approved
- **Org2MSP: true** - Org2 has approved
- **Both true** = Ready to commit ✅

**What if not ready?**
- If any org shows `false`, they haven't approved yet
- Cannot commit until majority approval
- Must wait for remaining approvals

---

### Step 7: Commit Chaincode to Channel

**Command:**
```bash
peer lifecycle chaincode commit -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID mychannel \
  --name tracient \
  --version 1.0 \
  --sequence 1 \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
```

**What this does:**
- **commit** - Activates chaincode on the channel
- Creates chaincode definition transaction
- Sends to orderer for ordering
- Distributed to all peers
- Chaincode becomes available for invocation

**Why multiple peer addresses?**
- Commit transaction itself requires endorsement
- Default policy: majority of orgs must endorse commit
- Both peer addresses ensure both orgs participate

**Output:**
```
2025-12-10 11:38:09.645 IST 0001 INFO [chaincodeCmd] ClientWait -> txid [3d50bf1b87c80fab41e2a1fe1647a22d86efcf77a2d7ac4b7ce07bf81ad9f231] committed with status (VALID) at localhost:9051
2025-12-10 11:38:09.683 IST 0002 INFO [chaincodeCmd] ClientWait -> txid [3d50bf1b87c80fab41e2a1fe1647a22d86efcf77a2d7ac4b7ce07bf81ad9f231] committed with status (VALID) at localhost:7051
```

**Understanding the output:**
- **Same txid on both peers** - Same transaction committed everywhere
- **status (VALID)** - Both peers validated successfully
- **Two confirmations** - Proves distributed consensus

**What happened:**
1. Commit request sent to both peers (endorsement)
2. Both peers executed commit logic and signed
3. Signed transaction sent to orderer
4. Orderer created block with commit transaction
5. Block distributed to all peers
6. Peers validated and committed block
7. **Chaincode is now ACTIVE** 🎉

**Blockchain state after commit:**
- Chaincode definition stored on ledger
- All channel members see the definition
- Chaincode ready to process transactions

---

### Step 8: Verify Chaincode Deployment

**Command:**
```bash
peer lifecycle chaincode querycommitted --channelID mychannel --name tracient
```

**What this does:**
- Queries the committed chaincode definition
- Confirms chaincode is active on channel
- Shows approval status and plugins

**Output:**
```
Committed chaincode definition for chaincode 'tracient' on channel 'mychannel':
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [Org1MSP: true, Org2MSP: true]
```

**Understanding the output:**

| Field | Value | Meaning |
|-------|-------|---------|
| **Version** | 1.0 | Human-readable version identifier |
| **Sequence** | 1 | First deployment (increments with upgrades) |
| **Endorsement Plugin** | escc | Default endorsement system chaincode |
| **Validation Plugin** | vscc | Default validation system chaincode |
| **Approvals** | Org1MSP: true, Org2MSP: true | Both orgs approved |

**Endorsement Plugin (escc):**
- Validates transaction signatures
- Ensures endorsement policy is met
- Checks signer identities

**Validation Plugin (vscc):**
- Validates transactions during block commit
- Checks read-write sets for conflicts
- Enforces chaincode-specific rules

---

### Step 9: Initialize the Ledger

**Command:**
```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n tracient \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'
```

**What this does:**
- **invoke** - Executes a chaincode function (writes to ledger)
- **InitLedger** - Your chaincode function that seeds sample data
- **Args:[]** - No arguments needed for InitLedger

**Transaction flow:**
1. Client sends proposal to both peers
2. Each peer simulates transaction (executes InitLedger)
3. Each peer returns signed response (endorsement)
4. Client collects endorsements
5. Client submits transaction to orderer
6. Orderer creates block
7. Peers validate and commit block
8. Ledger updated with sample data

**Output:**
```
2025-12-10 11:49:13.522 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200
```

**Understanding the output:**
- **status:200** - Transaction successful
- **Chaincode invoke successful** - Function executed without errors
- Sample data now exists on blockchain

**What InitLedger creates:**
- Key: `WAGE001`
- Value: Worker-001 wage record (₹1200.50 for construction work)

---

### Step 10: Query the Ledger

**Command:**
```bash
peer chaincode query -C mychannel -n tracient -c '{"Args":["ReadWage","WAGE001"]}'
```

**What this does:**
- **query** - Reads from ledger (no blockchain update)
- **ReadWage** - Your chaincode function to retrieve wage record
- **WAGE001** - Key of the record to read

**Why query is different from invoke:**

| Aspect | Query | Invoke |
|--------|-------|--------|
| **Operation** | Read-only | Read + Write |
| **Blockchain** | Not recorded | Creates transaction |
| **Consensus** | Not needed | Requires endorsement |
| **Speed** | Fast (local) | Slower (distributed) |
| **Cost** | Free | Uses network resources |

**Output:**
```json
{
  "workerIdHash":"worker-001",
  "employerIdHash":"employer-001",
  "amount":1200.5,
  "currency":"INR",
  "jobType":"construction",
  "timestamp":"2025-12-10T06:19:13Z",
  "policyVersion":"2025-Q4"
}
```

**Understanding the data:**
- **workerIdHash** - Hashed worker identifier (not real Aadhar)
- **employerIdHash** - Hashed employer identifier
- **amount** - Wage amount (₹1200.50)
- **currency** - INR (Indian Rupee)
- **jobType** - Type of work performed
- **timestamp** - When InitLedger was executed (UTC)
- **policyVersion** - Policy compliance version

**Significance:**
- Data is immutable (cannot be changed)
- All channel members see same data
- Cryptographically verifiable
- Provides audit trail

---

### Step 11: Record a New Wage Transaction

**Command:**
```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n tracient \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"RecordWage","Args":["WAGE002","worker-002","employer-002","2500.00","INR","MGNREGA","2025-12-10T11:50:00Z","2025-Q4"]}'
```

**Function parameters explained:**

| Position | Parameter | Value | Purpose |
|----------|-----------|-------|---------|
| 1 | wageID | WAGE002 | Unique identifier for this wage record |
| 2 | workerIDHash | worker-002 | Hashed worker identifier |
| 3 | employerIDHash | employer-002 | Hashed employer identifier |
| 4 | amount | 2500.00 | Wage amount in rupees |
| 5 | currency | INR | Currency code |
| 6 | jobType | MGNREGA | Government scheme identifier |
| 7 | timestamp | 2025-12-10T11:50:00Z | When work was completed |
| 8 | policyVersion | 2025-Q4 | Compliance policy version |

**Output:**
```
2025-12-10 11:53:39.434 IST 0001 INFO [chaincodeCmd] chaincodeInvokeOrQuery -> Chaincode invoke successful. result: status:200
```

**What happened behind the scenes:**

1. **Proposal Phase:**
   - Client sends RecordWage proposal to Org1 peer
   - Client sends same proposal to Org2 peer
   - Each peer simulates transaction independently

2. **Endorsement Phase:**
   - Org1 peer: Executes RecordWage → Signs result
   - Org2 peer: Executes RecordWage → Signs result
   - Client receives 2 signed endorsements

3. **Ordering Phase:**
   - Client packages endorsements into transaction
   - Sends to orderer at localhost:7050
   - Orderer adds transaction to next block

4. **Validation Phase:**
   - Orderer distributes block to all peers
   - Each peer validates:
     - Endorsements valid? ✅
     - Signatures valid? ✅
     - Policy satisfied? ✅ (both orgs endorsed)
     - No conflicts? ✅

5. **Commit Phase:**
   - Peers commit block to blockchain
   - Update world state database
   - New record `WAGE002` now exists

**Blockchain impact:**
- New block created
- Block contains RecordWage transaction
- Channel height increased by 1
- Immutable record created

---

### Step 12: Verify New Record

**Command:**
```bash
peer chaincode query -C mychannel -n tracient -c '{"Args":["ReadWage","WAGE002"]}'
```

**Output:**
```json
{
  "workerIdHash":"worker-002",
  "employerIdHash":"employer-002",
  "amount":2500,
  "currency":"INR",
  "jobType":"MGNREGA",
  "timestamp":"2025-12-10T11:50:00Z",
  "policyVersion":"2025-Q4"
}
```

**Verification success!** ✅

**What this proves:**
- Transaction was successfully committed
- Data persists on blockchain
- All peers have consistent data
- MGNREGA wage of ₹2500 recorded permanently

---

## Summary: What We Accomplished

### ✅ Completed Milestones

1. **Network Setup** ✅
   - 6 containers running (3 CAs, 2 peers, 1 orderer)
   - Channel "mychannel" active with 2 organizations
   - Certificate-based identity management

2. **Chaincode Deployment** ✅
   - Packaged TRACIENT Go chaincode
   - Installed on both organization peers
   - Both organizations approved
   - Committed to channel (now active)

3. **Testing & Validation** ✅
   - Initialized ledger with sample data
   - Successfully recorded wage transaction
   - Verified data retrieval
   - Confirmed immutability

### 📊 Current Blockchain State

**Channel:** mychannel  
**Block Height:** ~7 blocks
- Block 0: Genesis block
- Block 1: Org1 anchor peer
- Block 2: Org2 anchor peer
- Block 3: Org2 chaincode approval
- Block 4: Org1 chaincode approval
- Block 5: Chaincode commit
- Block 6: InitLedger transaction
- Block 7: RecordWage (WAGE002) transaction

**Chaincode:** tracient v1.0 (sequence 1)  
**Records:** 2 wage records (WAGE001, WAGE002)

---

## Next Steps

### ⏳ Pending: Production Enhancements
1. Implement Aadhar hash integration
2. Add database layer for PII storage
3. Create REST API for application integration
4. Implement access control policies
5. Add query functions (by worker, by date range)
6. Set up monitoring and logging
7. Deploy to production-grade network

---

## Useful Commands

### Check Network Status
```bash
# List running containers
docker ps

# Check channel info
peer channel getinfo -c mychannel

# List joined channels
peer channel list
```

### View Logs
```bash
# Orderer logs
docker logs orderer.example.com

# Peer logs
docker logs peer0.org1.example.com
docker logs peer0.org2.example.com

# CA logs
docker logs ca_org1
```

### Stop/Start Network
```bash
# Stop network (preserves data)
docker-compose -f compose/compose-test-net.yaml stop

# Start network (resume)
docker-compose -f compose/compose-test-net.yaml start

# Completely remove network
./network.sh down
```

---

## Troubleshooting

### Issue: Docker credential error
**Symptom:** `exec format error` when pulling images  
**Solution:** Disable Windows credential helper (Step 6)

### Issue: Permission denied on Docker
**Symptom:** `permission denied while trying to connect to Docker daemon`  
**Solution:** Add user to docker group (Step 5)

### Issue: Peer binary not found
**Symptom:** `Peer binary and configuration files not found`  
**Solution:** Ensure `config` directory exists in `network/` (Step 11)

### Issue: Port already in use
**Symptom:** `bind: address already in use`  
**Solution:** Run `./network.sh down` first to clean up

---

## References

- **Hyperledger Fabric Docs:** https://hyperledger-fabric.readthedocs.io/
- **Test Network Guide:** https://hyperledger-fabric.readthedocs.io/en/latest/test_network.html
- **Chaincode Tutorial:** https://hyperledger-fabric.readthedocs.io/en/latest/deploy_chaincode.html
- **Certificate Authority:** https://hyperledger-fabric-ca.readthedocs.io/

---

**Last Updated:** December 10, 2025, 10:44 IST  
**Network Status:** ✅ ACTIVE  
**Channel:** mychannel (Height: 3 blocks)  
**Next Phase:** Chaincode Deployment
