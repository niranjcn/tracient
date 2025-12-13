# TRACIENT Blockchain - Network Startup Guide

## 🚀 How to Start the Network When It's Closed

---

## Quick Start (2 Minutes)

```bash
cd /mnt/e/Major-Project/blockchain
./start-network.sh
```

**That's it!** ✅ Network will be running in ~2 minutes.

---

## Detailed Options

### Option 1: Full Setup (Network + Chaincode)
```bash
./start-network.sh
```
- Starts all 6 containers
- Creates channel "mychannel"
- Deploys TRACIENT chaincode
- Ready for transactions

### Option 2: Network Only
```bash
./start-network.sh --network-only
```
- Starts network containers
- Creates channel
- Skips chaincode deployment

### Option 3: Clean Start
```bash
./start-network.sh --clean
```
- Removes all previous data
- Fresh certificates generated
- Clean blockchain state

---

## Checking Network Status

```bash
# Check running containers
docker ps

# Expected output: 6 containers
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - ca_org1
# - ca_org2
# - ca_orderer
```

---

## Testing the Network

### Initialize Ledger with Sample Data

```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
export PATH=/mnt/e/Major-Project/blockchain/network/bin:$PATH
export FABRIC_CFG_PATH=/mnt/e/Major-Project/blockchain/network/config

# Set Org1 environment
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Initialize ledger
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n tracient \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"InitLedger","Args":[]}'
```

### Query Sample Data

```bash
peer chaincode query -C mychannel -n tracient -c '{"Args":["ReadWage","WAGE001"]}'
```

**Expected Output:**
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

---

## Recording New Wage Transaction

```bash
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel -n tracient \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"RecordWage","Args":["WAGE010","worker-010","employer-005","4500.00","INR","MGNREGA","2025-12-10T15:30:00Z","2025-Q4"]}'
```

---

## Stopping the Network

```bash
cd /mnt/e/Major-Project/blockchain/network/test-network

# Stop network (preserves data)
./network.sh down
```

---

## Troubleshooting

### Network Won't Start

**Check Docker is running:**
```bash
docker ps
```

**If error, restart Docker:**
```bash
sudo systemctl restart docker
# OR restart Docker Desktop on Windows
```

### Permission Denied

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Containers Already Running

```bash
# Stop existing network first
cd /mnt/e/Major-Project/blockchain/network/test-network
./network.sh down

# Then start fresh
cd /mnt/e/Major-Project/blockchain
./start-network.sh
```

### Chaincode Not Responding

```bash
# Check chaincode container logs
docker logs $(docker ps -qf "name=dev-peer")

# Redeploy chaincode
./start-network.sh --clean
```

---

## Common Commands

| Task | Command |
|------|---------|
| **Start network** | `./start-network.sh` |
| **Stop network** | `./network.sh down` |
| **Check status** | `docker ps` |
| **View logs** | `docker logs <container-name>` |
| **Query chaincode** | `peer chaincode query -C mychannel -n tracient -c '{...}'` |
| **Invoke chaincode** | `peer chaincode invoke -o localhost:7050 ... -c '{...}'` |

---

## For Your Team

When sharing this project with team members, they only need to:

1. **Install prerequisites** (Docker, WSL2, Go, Node.js)
2. **Clone the repository**
3. **Run one command:**
   ```bash
   ./start-network.sh
   ```

**No manual configuration needed!** 🎉

---

## Next Steps

- ✅ Network running
- ⏳ Build REST API
- ⏳ Set up PostgreSQL database
- ⏳ Create frontend dashboard
- ⏳ Integrate Aadhar verification

See [BLOCKCHAIN_SETUP_GUIDE.md](BLOCKCHAIN_SETUP_GUIDE.md) for detailed documentation.

---

**Created:** December 10, 2025  
**Status:** Production Ready ✅
