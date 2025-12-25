# TRACIENT Blockchain - Usage Guide

## Quick Reference

### First Time Setup (Clean Start)
```bash
./start-network.sh
```
**WARNING**: This removes ALL data and starts fresh!

### Daily Usage (Preserves Data)

**1. Start Network (if stopped)**
```bash
./restart-network.sh
```
This just starts Docker containers without removing data.

**2. Deploy/Update Chaincode**
```bash
./deploy-chaincode.sh
```
This installs Go if needed and deploys the tracient chaincode.

**3. Check Status**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Testing Chaincode

**Setup environment first:**
```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

**Test commands:**
```bash
# Check channel
peer channel list

# Check installed chaincode
peer lifecycle chaincode queryinstalled

# Check committed chaincode
peer lifecycle chaincode querycommitted -C mychannel

# Initialize ledger
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'

# Read wage
peer chaincode query -C mychannel -n tracient -c '{"function":"ReadWage","Args":["WAGE001"]}'
```

## Common Workflows

### Scenario 1: Computer Restarted
```bash
# Containers stopped but data preserved
./restart-network.sh      # Start containers
# Chaincode already installed, ready to use
```

### Scenario 2: Update Chaincode
```bash
# Network is running, need to update code
# Edit chaincode.go
./deploy-chaincode.sh     # Redeploy with new version
```

### Scenario 3: Fresh Start (Testing)
```bash
# Want to clear all data and start over
./start-network.sh        # Removes everything and starts fresh
```

## Data Persistence

- **Docker Volumes**: Store blockchain ledger data
- **Preserved by**: `restart-network.sh`
- **Removed by**: `start-network.sh`, `network.sh down`

**Location**: 
- `compose_peer0.org1.example.com`
- `compose_peer0.org2.example.com`
- `compose_orderer.example.com`

## Troubleshooting

### "chaincode tracient not found"
```bash
./deploy-chaincode.sh
```

### "Go not found"
```bash
./install-go.sh
source ~/.bashrc
```

### Network won't start
```bash
cd network/test-network
./network.sh down    # Clean up
cd ../../
./start-network.sh   # Fresh start
```

### Check container logs
```bash
docker logs peer0.org1.example.com
docker logs orderer.example.com
```
