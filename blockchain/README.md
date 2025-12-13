# Tracient Blockchain Stack

This guide bootstraps a Hyperledger Fabric test network and prepares the Go-based `tracient` chaincode.
All commands are written for Windows 11 with PowerShell and WSL2 (Ubuntu 22.04). Running Fabric
inside WSL is strongly recommended; native Windows binaries are not officially supported.

## 1. Prerequisites
- Windows 11 with WSL2 enabled and Ubuntu installed (`wsl --install -d Ubuntu`).
- Docker Desktop 4.28+ with the WSL 2 backend enabled and >8 GB RAM assigned.
- Go 1.20.x installed inside WSL (`sudo snap install go --classic`).
- Node.js 18.x + npm and Python 3.10 for Fabric utilities (`sudo apt install nodejs npm python3-pip`).
- Git (`sudo apt install git`).

> Tip: keep your workspace (`/mnt/e/Major-Project`) mounted inside WSL so both Windows and WSL share the files.

## 2. Directory Layout
```
blockchain/
  README.md            ← this guide
  chaincode/
    tracient/
      go.mod
      chaincode.go
  network/             ← fabric samples & docker compose files will live here
```

## 3. Download Fabric Binaries & Samples
Run the following inside WSL from `~/` (not PowerShell):
```bash
cd ~
curl -sSL https://bit.ly/2ysbiFn | bash -s -- 2.5.2 1.5.2
```
This installs:
- `fabric-samples/` (tutorial networks)
- Fabric binaries (`bin/`) and Docker images for Fabric v2.5.2 & Fabric CA v1.5.2.

Symlink or copy the samples into the repo so commands can run relative to the workspace:
```bash
mkdir -p /mnt/e/Major-Project/blockchain/network
cp -r ~/fabric-samples/test-network /mnt/e/Major-Project/blockchain/network/
cp -r ~/fabric-samples/bin /mnt/e/Major-Project/blockchain/network/bin
```
Add the binaries to PATH (append to `~/.bashrc`):
```bash
echo 'export PATH=$PATH:$HOME/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc
```

## 4. Launch the Test Network
From WSL:
```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
./network.sh down              # ensure a clean slate
./network.sh up createChannel -ca -c mychannel
./network.sh deployCC -ccn basic -c mychannel
```
At this point peers, orderer, and certificate authorities are running in Docker containers.

## 5. Deploy the Tracient Chaincode
1. **Package the chaincode**
   ```bash
   cd /mnt/e/Major-Project/blockchain/network/test-network
   export CC_NAME=tracient
   export CC_PATH=../..//chaincode/tracient
   export CC_LABEL=${CC_NAME}_1
   export CC_SEQUENCE=1
   export CC_VERSION=1.0
   ./network.sh deployCC -c mychannel -ccn $CC_NAME -ccp $CC_PATH -ccl go -ccv $CC_VERSION -ccep "OR('Org1MSP.peer','Org2MSP.peer')"
   ```
   The helper script handles packaging, install, approval, and commit for Org1 & Org2.

2. **Invoke InitLedger**
   ```bash
   ./network.sh chaincode invoke -ccn $CC_NAME -c '{"Args":["InitLedger"]}'
   ```

3. **Query a record**
   ```bash
   ./network.sh chaincode query -ccn $CC_NAME -c '{"Args":["ReadWage","WAGE001"]}'
   ```

## 6. Manual peer lifecycle (optional)
If you need direct control, source the peer environment and run CLI commands:
```bash
cd /mnt/e/Major-Project/blockchain/network/test-network
source ./scripts/envVar.sh
setGlobals 1
peer lifecycle chaincode package tracient.tar.gz --path ../../chaincode/tracient --lang golang --label tracient_1
peer lifecycle chaincode install tracient.tar.gz
peer lifecycle chaincode queryinstalled
# capture package ID and continue with approveformyorg + commit
```

## 7. Next Steps
- Extend `chaincode.go` with business logic (`RecordWage`, `QueryWageHistory`).
- Write unit tests using `chaincode/test` folder (`go test ./...`).
- Automate network start/stop via PowerShell wrappers for Windows teammates.
- Document environment variables and organization-specific identities for the multi-org rollout in later phases.

Troubleshooting tips are tracked in `docs/blockchain_troubleshooting.md` (to be created).
