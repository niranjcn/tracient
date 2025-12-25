#!/bin/bash
#
# TRACIENT Blockchain - Quick Restart (Data Preservation)
# 
# Use this when network containers need to be restarted but you want to preserve data.
# This script will NOT remove volumes, so all blockchain data persists.
#
# Usage:
#   ./restart-network.sh              # Restart and auto-check chaincode
#   ./restart-network.sh --force      # Force restart even if running
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Auto-detect script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="${SCRIPT_DIR}/network/test-network"

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      TRACIENT Network Restart (Data Preserved)             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
FORCE_RESTART=false
for arg in "$@"; do
    case $arg in
        --force|-f)
            FORCE_RESTART=true
            ;;
    esac
done

cd "$NETWORK_DIR" || { print_error "Network directory not found"; exit 1; }

# Check if Docker is running
if ! docker ps &> /dev/null; then
    print_error "Docker daemon not running"
    exit 1
fi

# Check current state
RUNNING=$(docker ps --filter "name=peer0.org1" --format "{{.Names}}" | wc -l)

if [ "$RUNNING" -gt 0 ] && [ "$FORCE_RESTART" = false ]; then
    print_info "Network is already running"
    echo ""
    echo "Running containers:"
    docker ps --filter "name=peer0\|orderer\|ca" --format "  • {{.Names}} - {{.Status}}" | head -6
    echo ""
    print_info "Use --force to restart anyway"
    print_info "Or use ./test-chaincode.sh to test functions"
    exit 0
fi

# Stop containers (preserve volumes)
echo "[1/4] Stopping containers (preserving data)..."
docker-compose -f compose/compose-test-net.yaml -f compose/compose-ca.yaml stop 2>/dev/null || true
print_status "Containers stopped"

# Start containers
echo "[2/4] Starting containers..."
docker-compose -f compose/compose-test-net.yaml -f compose/compose-ca.yaml start 2>/dev/null || \
docker-compose -f compose/compose-test-net.yaml -f compose/compose-ca.yaml up -d
print_status "Containers started"

# Wait for containers to be ready
echo "[3/4] Waiting for network to stabilize..."
sleep 5

# Set up environment
export PATH="${SCRIPT_DIR}/network/bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

# Check chaincode status
echo "[4/4] Verifying chaincode installation..."

# Verify peer connection
if ! peer channel list &> /dev/null; then
    print_warning "Peer not responding yet, waiting..."
    sleep 10
fi

INSTALLED=$(peer lifecycle chaincode queryinstalled 2>&1 || true)

if echo "$INSTALLED" | grep -q "tracient"; then
    print_status "Chaincode is installed and ready"
    
    # Verify chaincode is committed
    COMMITTED=$(peer lifecycle chaincode querycommitted -C mychannel -n tracient 2>&1 || true)
    if echo "$COMMITTED" | grep -q "Version:"; then
        VERSION=$(echo "$COMMITTED" | grep "Version:" | awk '{print $2}' | tr -d ',')
        print_status "Chaincode committed (version: $VERSION)"
    fi
else
    print_warning "Chaincode not found. Redeploying..."
    
    # Run deploy script
    if [ -f "${SCRIPT_DIR}/deploy-chaincode.sh" ]; then
        bash "${SCRIPT_DIR}/deploy-chaincode.sh"
    else
        print_error "deploy-chaincode.sh not found"
        print_info "Run: ./start-network.sh to deploy chaincode"
        exit 1
    fi
fi

echo ""

# Test a simple query
echo "Testing chaincode..."
RESULT=$(peer chaincode query -C mychannel -n tracient -c '{"function":"WageExists","Args":["WAGE001"]}' 2>&1 || true)
if echo "$RESULT" | grep -q "true\|false"; then
    print_status "Chaincode responding correctly"
else
    print_warning "Chaincode query returned unexpected result"
    print_info "Result: $RESULT"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ TRACIENT Network Restarted Successfully${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Running containers:"
docker ps --filter "name=peer0\|orderer\|ca\|dev-peer" --format "  • {{.Names}} - {{.Status}}" | head -8
echo ""
echo "Next steps:"
echo "  • source ./set-env.sh           # Set environment variables"
echo "  • ./test-chaincode.sh           # Test all functions"
echo "  • peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"WAGE001\"]}'"
echo ""
