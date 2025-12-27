# ✅ Hyperledger Fabric Setup - Next Steps

## Status: PACKAGES INSTALLED ✓

Your backend now shows:
```
✓ Hyperledger Fabric packages loaded successfully
```

Great! The Node.js packages are installed. Now you need to start the Fabric network.

---

## Quick Start (2 Methods)

### Method 1: Windows PowerShell (Recommended)

```powershell
# Open PowerShell and go to blockchain directory
cd C:\Users\nevrp\OneDrive\majorproject\tracient\blockchain

# Start the Fabric network (all-in-one command for WSL)
wsl bash ./start-network.sh
```

Wait 2-3 minutes for all containers to start.

### Method 2: WSL Terminal (Advanced)

If you have WSL installed:

```bash
# Open WSL terminal
cd /mnt/c/Users/nevrp/OneDrive/majorproject/tracient/blockchain
bash ./start-network.sh
```

---

## Verify Network is Running

```powershell
# In PowerShell
docker ps

# You should see 6 containers:
# - orderer.example.com
# - peer0.org1.example.com
# - peer0.org2.example.com
# - ca_org1
# - ca_org2
# - ca_orderer
```

---

## Then Restart Backend

Once the network is running, restart the backend:

```powershell
# In backend folder
cd backend
npm start
```

**You should now see:**
```
✓ Hyperledger Fabric packages loaded successfully
✓ Hyperledger Fabric Gateway initialized successfully
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Docker not running** | Start Docker Desktop from Windows Start Menu |
| **WSL not installed** | Download from Microsoft Store: "Windows Subsystem for Linux" |
| **Port 7051 in use** | Run: `docker ps` and stop conflicting containers |
| **Network won't start** | Try: `wsl bash ./fresh-start.sh` in blockchain folder |

---

## Files Already Updated

✅ `backend/.env` - Fabric enabled with configuration  
✅ `backend/package.json` - Fabric packages installed  
✅ `backend/server.js` - Fabric initialization added  

---

**Next:** Follow the commands above to start the Fabric network!

