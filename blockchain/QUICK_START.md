# Quick Start Guide: TRACIENT Test Network

**Last Updated:** December 10, 2025

---

## 🚀 Quick Commands Reference

### Prerequisites Check
```bash
# Run in WSL terminal
wsl --list --verbose           # WSL status
docker --version              # Docker 4.28+
go version                    # Go 1.20+
node --version                # Node.js 18+
```

---

## 📦 Installation (One-Time Setup)

### Step 1: Download Fabric
```bash
cd ~
curl -sSL https://bit.ly/2ysbiFn | bash -s -- 2.5.2 1.5.2
```

### Step 2: Setup Project Structure
```bash
mkdir -p /mnt/e/Major-Project/blockchain/network
cp -r ~/fabric-samples/test-network /mnt/e/Major-Project/blockchain/network/
cp -r ~/fabric-samples/bin /mnt/e/Major-Project/blockchain/network/bin
echo 'export PATH=$PATH:$HOME/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc
```

---

## 🏃 Daily Workflow Commands

### Start Network
```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
./network.sh down                                    # Clean previous
./network.sh up createChannel -ca -c mychannel       # Start network
```

### Deploy Chaincode
```bash
export CC_NAME=tracient
export CC_PATH=../../chaincode/tracient
./network.sh deployCC -c mychannel -ccn $CC_NAME -ccp $CC_PATH -ccl go -ccep "OR('Org1MSP.peer','Org2MSP.peer')"
```

### Initialize Ledger
```bash
./network.sh chaincode invoke -ccn tracient -c '{"Args":["InitLedger"]}'
```

### Test Operations
```bash
# Read a wage
./network.sh chaincode query -ccn tracient -c '{"Args":["ReadWage","WAGE001"]}'

# Record new wage
./network.sh chaincode invoke -ccn tracient -c '{"Args":["RecordWage","WAGE002","worker-abc","employer-xyz","3000","INR","construction","","2025-Q4"]}'
```

### Stop Network
```bash
./network.sh down
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Docker not running | `sudo systemctl start docker` |
| Port conflict | `./network.sh down` then restart |
| Permission denied | `sudo usermod -aG docker $USER` then logout/login |
| Chaincode build failed | `cd chaincode/tracient; go mod tidy` |

---

## 📊 Check Network Status

```bash
# View running containers
docker ps

# View logs
docker logs peer0.org1.example.com
docker logs orderer.example.com

# Check chaincode installation
peer lifecycle chaincode queryinstalled
```

---

## 🔧 Update Chaincode

After modifying `chaincode.go`:

```bash
# Update version
export CC_VERSION=1.1
export CC_SEQUENCE=2

# Redeploy
./network.sh deployCC -c mychannel -ccn tracient -ccp ../../chaincode/tracient -ccl go -ccv $CC_VERSION -ccs $CC_SEQUENCE
```

---

## ⚡ Quick Test Suite

```bash
# Test 1: Initialize
./network.sh chaincode invoke -ccn tracient -c '{"Args":["InitLedger"]}'

# Test 2: Read
./network.sh chaincode query -ccn tracient -c '{"Args":["ReadWage","WAGE001"]}'

# Test 3: Create
./network.sh chaincode invoke -ccn tracient -c '{"Args":["RecordWage","TEST001","hash1","hash2","1500","INR","retail","","2025-Q4"]}'

# Test 4: Verify
./network.sh chaincode query -ccn tracient -c '{"Args":["ReadWage","TEST001"]}'

# Test 5: History
./network.sh chaincode query -ccn tracient -c '{"Args":["QueryWageHistory","TEST001"]}'
```

---

## 📁 Important File Locations

```
~/fabric-samples/              # Fabric installation
/mnt/e/Major-Project/
└── blockchain/
    ├── chaincode/
    │   └── tracient/
    │       └── chaincode.go   # Your smart contract
    └── network/
        ├── test-network/      # Network scripts
        └── bin/               # Fabric binaries
```

---

## 💡 Pro Tips

1. **Always run in WSL, not PowerShell**
2. **Run `./network.sh down` before starting to ensure clean state**
3. **Check Docker Desktop is running before starting network**
4. **Use `-ca` flag to enable Certificate Authorities**
5. **Keep terminal open while network is running**

---

**For detailed information, see:** `BLOCKCHAIN_STATUS_REPORT.md`
