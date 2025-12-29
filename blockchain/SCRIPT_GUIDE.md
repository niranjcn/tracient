# TRACIENT Blockchain Scripts Guide

## Quick Reference

### 🚀 First Time Setup (Fresh Installation)
```bash
cd blockchain
wsl -e bash -c './fresh-start.sh --yes'
```
This single command will:
1. Clean up any existing Docker containers/volumes
2. Start the Hyperledger Fabric network
3. Create the `mychannel` channel
4. Deploy the `tracient` chaincode v2.0
5. Initialize the ledger with sample data

### 🔄 Daily Use (Network Already Set Up)

**If network is stopped (containers not running):**
```bash
wsl -e bash -c './start-network.sh'
```

**If network is running but need to restart:**
```bash
wsl -e bash -c './restart-network.sh --force'
```

**To test if everything is working:**
```bash
wsl -e bash -c './quick-test.sh'
```

---

## Main Scripts (blockchain/ folder)

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `fresh-start.sh` | Complete cleanup & fresh start | First time setup, OR when you want to reset everything |
| `start-network.sh` | Start network & deploy chaincode | When network is stopped |
| `restart-network.sh` | Restart containers (preserve data) | Quick restart without losing data |
| `deploy-chaincode.sh` | Deploy/upgrade chaincode only | After modifying chaincode |
| `test-chaincode.sh` | Full test suite (24 functions) | Verify all functions work |
| `quick-test.sh` | Quick 5-function test | Fast verification |

---

## Detailed Script Usage

### 1. fresh-start.sh
**Complete cleanup and fresh start - USE WITH CAUTION**

```bash
# Full cleanup and restart (will ask for confirmation)
wsl -e bash -c './fresh-start.sh'

# Auto-confirm (no prompt)
wsl -e bash -c './fresh-start.sh --yes'

# Cleanup only (don't restart)
wsl -e bash -c './fresh-start.sh --cleanup'
```

**What it does:**
- Stops all Docker containers
- Removes all chaincode containers/images
- Removes Docker volumes (ALL DATA LOST)
- Starts fresh network
- Deploys chaincode
- Initializes ledger

### 2. start-network.sh
**Start network with smart detection**

```bash
# Smart start (preserves existing data if possible)
wsl -e bash -c './start-network.sh'

# Clean start (like fresh-start)
wsl -e bash -c './start-network.sh clean'

# Network only (skip chaincode deployment)
wsl -e bash -c './start-network.sh --network-only'
```

### 3. restart-network.sh
**Quick restart preserving data**

```bash
# Check status and restart if needed
wsl -e bash -c './restart-network.sh'

# Force restart even if running
wsl -e bash -c './restart-network.sh --force'
```

### 4. deploy-chaincode.sh
**Deploy or upgrade chaincode**

```bash
# Auto-detect version and deploy
wsl -e bash -c './deploy-chaincode.sh'

# Deploy specific version
wsl -e bash -c './deploy-chaincode.sh --version 3.0'
```

### 5. test-chaincode.sh
**Comprehensive test suite**

```bash
# Run all 24 function tests
wsl -e bash -c './test-chaincode.sh'

# Quick mode (essential tests only)
wsl -e bash -c './test-chaincode.sh --quick'

# Verbose output
wsl -e bash -c './test-chaincode.sh --verbose'
```

### 6. quick-test.sh
**Fast 5-function verification**

```bash
wsl -e bash -c './quick-test.sh'
```

---

## Scripts in scripts/ folder

| Script | Purpose |
|--------|---------|
| `register-users.sh` | Register users with IAM attributes |
| `test-all-functions.sh` | Extended test with multiple identities |
| `test-iam-simple.sh` | Test IAM access control |
| `diagnose-identities.sh` | Debug identity issues |

---

## Common Workflows

### Workflow 1: First Time Setup
```bash
cd blockchain
wsl -e bash -c './fresh-start.sh --yes'
wsl -e bash -c './quick-test.sh'
```

### Workflow 2: Daily Development
```bash
# Start your day
wsl -e bash -c './restart-network.sh'

# After modifying chaincode
wsl -e bash -c './deploy-chaincode.sh'
wsl -e bash -c './test-chaincode.sh'
```

### Workflow 3: Something Went Wrong
```bash
# Try restart first
wsl -e bash -c './restart-network.sh --force'

# If still broken, fresh start
wsl -e bash -c './fresh-start.sh --yes'
```

### Workflow 4: Reset Everything
```bash
wsl -e bash -c './fresh-start.sh --yes'
```

---

## Troubleshooting

### Error: "bad interpreter: No such file or directory"
Scripts have Windows line endings. Run:
```powershell
Get-ChildItem -Path "E:\Major-Project\blockchain\*.sh" | ForEach-Object { 
    $c = Get-Content $_.FullName -Raw
    $c = $c -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($_.FullName, $c) 
}
```

### Error: "Docker daemon not running"
Start Docker Desktop on Windows first.

### Error: "Network not running"
```bash
wsl -e bash -c './start-network.sh'
```

### Error: "Chaincode not deployed"
```bash
wsl -e bash -c './deploy-chaincode.sh'
```

### Error: "Permission denied"
```bash
wsl -e bash -c 'chmod +x *.sh scripts/*.sh'
```

---

## Summary Decision Tree

```
Do you need to start from scratch?
├── YES → ./fresh-start.sh --yes
└── NO
    ├── Is network running? (docker ps shows containers)
    │   ├── YES → ./quick-test.sh (verify) or ./test-chaincode.sh (full test)
    │   └── NO → ./start-network.sh
    └── Did you modify chaincode?
        ├── YES → ./deploy-chaincode.sh
        └── NO → ./restart-network.sh
```
