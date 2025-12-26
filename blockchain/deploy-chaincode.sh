#!/bin/bash
#
# TRACIENT Blockchain - Deploy Chaincode Only
# 
# Use this script to deploy or upgrade chaincode without restarting the network.
# Automatically increments sequence number for upgrades.
#
# Usage:
#   ./deploy-chaincode.sh              # Deploy/upgrade chaincode
#   ./deploy-chaincode.sh --version 3.0  # Deploy specific version
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
CHAINCODE_PATH="${SCRIPT_DIR}/chaincode/tracient"

# Default configuration
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="tracient"
CHAINCODE_VERSION="2.0"
CHAINCODE_SEQUENCE="1"

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Parse arguments
for arg in "$@"; do
    case $arg in
        --version)
            shift
            CHAINCODE_VERSION="$1"
            shift
            ;;
        --sequence)
            shift
            CHAINCODE_SEQUENCE="$1"
            shift
            ;;
    esac
done

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      TRACIENT Chaincode Deployment                         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check prerequisites
echo "[1/5] Checking prerequisites..."

# Check Go
if ! command -v go &> /dev/null; then
    print_error "Go not found. Run: ./install-go.sh"
    exit 1
fi
print_status "Go found: $(go version | cut -d' ' -f3)"

# Check chaincode exists
if [ ! -f "${CHAINCODE_PATH}/chaincode.go" ]; then
    print_error "Chaincode not found at: ${CHAINCODE_PATH}"
    exit 1
fi
print_status "Chaincode found"

# Check network is running
cd "$NETWORK_DIR"
if ! docker ps | grep -q "peer0.org1.example.com"; then
    print_error "Network is not running. Start it with: ./restart-network.sh or ./start-network.sh"
    exit 1
fi
print_status "Network is running"
echo ""

# Step 2: Set up environment
echo "[2/5] Setting up environment..."
export PATH="${SCRIPT_DIR}/network/bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
print_status "Environment configured"
echo ""

# Step 3: Check current chaincode status
echo "[3/5] Checking current chaincode status..."

COMMITTED=$(peer lifecycle chaincode querycommitted -C $CHANNEL_NAME -n $CHAINCODE_NAME 2>&1 || true)

if echo "$COMMITTED" | grep -q "Version:"; then
    CURRENT_VERSION=$(echo "$COMMITTED" | grep "Version:" | awk '{print $2}' | tr -d ',')
    CURRENT_SEQ=$(echo "$COMMITTED" | grep "Sequence:" | awk '{print $2}' | tr -d ',')
    
    print_info "Current chaincode: v${CURRENT_VERSION}, sequence ${CURRENT_SEQ}"
    
    # Auto-increment sequence (handle decimal version numbers)
    CURRENT_SEQ_INT=$(echo "$CURRENT_SEQ" | cut -d'.' -f1)
    CHAINCODE_SEQUENCE=$((CURRENT_SEQ_INT + 1))
    print_info "Will deploy: v${CHAINCODE_VERSION}, sequence ${CHAINCODE_SEQUENCE}"
else
    print_info "No existing chaincode found. Fresh deployment."
fi
echo ""

# Step 4: Deploy chaincode
echo "[4/5] Deploying chaincode v${CHAINCODE_VERSION} (sequence ${CHAINCODE_SEQUENCE})..."
print_info "This may take a few minutes..."

# Remove old package if exists
rm -f "${NETWORK_DIR}/tracient.tar.gz" 2>/dev/null || true

# Check if collections config exists
COLLECTIONS_CONFIG="${CHAINCODE_PATH}/collections_config.json"
COLLECTIONS_FLAG=""
if [ -f "$COLLECTIONS_CONFIG" ]; then
    print_info "Private data collections config found"
    COLLECTIONS_FLAG="-cccg ${COLLECTIONS_CONFIG}"
fi

# Deploy using network.sh
./network.sh deployCC \
    -ccn $CHAINCODE_NAME \
    -ccp $CHAINCODE_PATH \
    -ccl go \
    -ccv $CHAINCODE_VERSION \
    -ccs $CHAINCODE_SEQUENCE \
    $COLLECTIONS_FLAG

if [ $? -ne 0 ]; then
    print_error "Chaincode deployment failed"
    exit 1
fi
print_status "Chaincode deployed successfully"
echo ""

# Step 5: Verify deployment
echo "[5/5] Verifying deployment..."

# Check if committed
COMMITTED=$(peer lifecycle chaincode querycommitted -C $CHANNEL_NAME -n $CHAINCODE_NAME 2>&1 || true)
if echo "$COMMITTED" | grep -q "Version: ${CHAINCODE_VERSION}"; then
    print_status "Chaincode committed to channel"
else
    print_warning "Chaincode commit verification inconclusive"
fi

# Test a simple query
sleep 2
RESULT=$(peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{"function":"WageExists","Args":["WAGE001"]}' 2>&1 || true)
if echo "$RESULT" | grep -q "true\|false"; then
    print_status "Chaincode responding to queries"
else
    print_warning "Query test returned unexpected result"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Chaincode Deployment Complete${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Deployment Details:"
echo "  • Chaincode: $CHAINCODE_NAME"
echo "  • Version: $CHAINCODE_VERSION"
echo "  • Sequence: $CHAINCODE_SEQUENCE"
echo "  • Channel: $CHANNEL_NAME"
echo ""
echo "Test with:"
echo "  ./test-chaincode.sh"
echo ""
echo "Or manual query:"
echo "  peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"WAGE001\"]}'"
echo ""
