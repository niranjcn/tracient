#!/bin/bash
#
# TRACIENT Blockchain Network Startup Script v2.0
# 
# This script starts the Hyperledger Fabric network and deploys the TRACIENT chaincode.
# Improved with cross-platform support and data persistence options.
#
# Usage:
#   ./start-network.sh                    # Preserve mode (keep existing data if possible)
#   ./start-network.sh clean              # Clean start (removes all data)
#   ./start-network.sh --network-only     # Only start network, skip chaincode
#   ./start-network.sh --help             # Show help
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Auto-detect script directory (works in both WSL and native Linux)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Configuration - using absolute paths
NETWORK_DIR="${SCRIPT_DIR}/network/test-network"
CHAINCODE_PATH="${SCRIPT_DIR}/chaincode/tracient"
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="tracient"
CHAINCODE_VERSION="2.0"
CHAINCODE_SEQUENCE="1"

# Package ID (set after installation)
CC_PACKAGE_ID=""

# Parse command line arguments
CLEAN_START=false
NETWORK_ONLY=false
SKIP_NETWORK=false

print_banner() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║      TRACIENT Blockchain Network Startup v2.0              ║${NC}"
    echo -e "${CYAN}║      Income Traceability for Welfare Distribution          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

show_help() {
    echo "TRACIENT Blockchain Network Startup Script v2.0"
    echo ""
    echo "Usage: ./start-network.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  (no option)       Preserve existing data, deploy only if needed"
    echo "  clean             Full cleanup and fresh start"
    echo "  --network-only    Start network only (skip chaincode deployment)"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./start-network.sh                 # Smart start with data preservation"
    echo "  ./start-network.sh clean           # Fresh start, remove all data"
    echo "  ./start-network.sh --network-only  # Start network, deploy chaincode later"
    echo ""
    echo "After starting, use:"
    echo "  source ${SCRIPT_DIR}/set-env.sh    # Set environment variables"
    echo "  ./test-chaincode.sh                # Test all chaincode functions"
    echo ""
}

for arg in "$@"; do
    case $arg in
        clean|--clean)
            CLEAN_START=true
            shift
            ;;
        --network-only)
            NETWORK_ONLY=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            # Unknown option
            ;;
    esac
done

print_banner

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/8]${NC} Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker Desktop."
    exit 1
fi
print_status "Docker found"

# Check Docker daemon
if ! docker ps &> /dev/null; then
    print_error "Docker daemon not running or permission denied."
    print_info "On WSL, make sure Docker Desktop is running"
    print_info "On Linux, run: sudo usermod -aG docker \$USER && newgrp docker"
    exit 1
fi
print_status "Docker daemon running"

# Check/Add Fabric binaries to PATH
if ! command -v peer &> /dev/null; then
    print_warning "Peer command not in PATH. Adding Fabric binaries..."
    export PATH="${SCRIPT_DIR}/network/bin:$PATH"
fi
print_status "Fabric binaries available"

# Check Go (add common installation paths)
if ! command -v go &> /dev/null; then
    # Try common Go installation locations
    if [ -d "/usr/local/go/bin" ]; then
        export PATH="/usr/local/go/bin:$PATH"
    elif [ -d "$HOME/go/bin" ]; then
        export PATH="$HOME/go/bin:$PATH"
    fi
fi

if ! command -v go &> /dev/null; then
    print_error "Go not found. Please run: ./install-go.sh"
    exit 1
fi
print_status "Go found: $(go version | cut -d' ' -f3)"

# Validate chaincode exists
if [ ! -f "${CHAINCODE_PATH}/chaincode.go" ]; then
    print_error "Chaincode not found at: ${CHAINCODE_PATH}"
    exit 1
fi
print_status "Chaincode found at: ${CHAINCODE_PATH}"
echo ""

# Step 2: Navigate to network directory
cd "$NETWORK_DIR" || { print_error "Network directory not found: ${NETWORK_DIR}"; exit 1; }

# Set environment variables
export PATH="${SCRIPT_DIR}/network/bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"

# Step 3: Handle existing network
echo -e "${YELLOW}[2/8]${NC} Checking existing network state..."

if docker ps | grep -q "peer0.org1.example.com"; then
    if [ "$CLEAN_START" = true ]; then
        print_warning "Network running. Performing clean shutdown..."
        ./network.sh down 2>/dev/null || true
        # Remove orphaned chaincode containers
        docker rm -f $(docker ps -aq --filter name=dev-peer) 2>/dev/null || true
        rm -f tracient.tar.gz
        print_status "Network stopped and cleaned"
    else
        print_info "Network is already running!"
        print_info "Checking chaincode installation..."
        
        # Set peer environment
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID="Org1MSP"
        export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
        export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
        export CORE_PEER_ADDRESS=localhost:7051
        
        INSTALLED=$(peer lifecycle chaincode queryinstalled 2>&1 || true)
        if echo "$INSTALLED" | grep -q "tracient"; then
            print_status "Chaincode already installed and running"
            print_info "Use './restart-network.sh' to restart the network"
            print_info "Use './test-chaincode.sh' to test chaincode functions"
            
            # Generate set-env.sh
            cat > "${SCRIPT_DIR}/set-env.sh" << 'ENVEOF'
#!/bin/bash
# TRACIENT Environment Setup Script
# Source this file: source ./set-env.sh

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export PATH="${SCRIPT_DIR}/network/bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${SCRIPT_DIR}/network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${SCRIPT_DIR}/network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

echo "✓ TRACIENT environment configured for Org1"
echo "  CORE_PEER_ADDRESS: $CORE_PEER_ADDRESS"
echo "  CORE_PEER_LOCALMSPID: $CORE_PEER_LOCALMSPID"
ENVEOF
            chmod +x "${SCRIPT_DIR}/set-env.sh"
            exit 0
        else
            print_warning "Chaincode not installed. Will deploy..."
            SKIP_NETWORK=true
        fi
    fi
else
    if [ "$CLEAN_START" = true ]; then
        print_info "Performing clean start..."
        ./network.sh down 2>/dev/null || true
        docker rm -f $(docker ps -aq --filter name=dev-peer) 2>/dev/null || true
        rm -f tracient.tar.gz
    fi
    print_status "No existing network found"
fi
echo ""

# Step 4: Start the network
if [ "$SKIP_NETWORK" != true ]; then
    echo -e "${YELLOW}[3/8]${NC} Starting Hyperledger Fabric network..."
    print_info "This will start 6 containers (3 CAs, 2 peers, 1 orderer)"
    
    ./network.sh up createChannel -ca -c $CHANNEL_NAME
    
    if [ $? -eq 0 ]; then
        print_status "Network started successfully"
        print_status "Channel '$CHANNEL_NAME' created"
    else
        print_error "Failed to start network"
        exit 1
    fi
    echo ""
fi

# Step 5: Verify network
echo -e "${YELLOW}[4/8]${NC} Verifying network status..."
sleep 3
RUNNING_CONTAINERS=$(docker ps --filter "name=peer0\|orderer\|ca" --format "{{.Names}}" | wc -l)
if [ "$RUNNING_CONTAINERS" -lt 6 ]; then
    print_warning "Expected 6 containers, found $RUNNING_CONTAINERS"
    print_info "Some containers may still be starting..."
    sleep 5
fi
print_status "Containers running"
docker ps --filter "name=peer0\|orderer\|ca" --format "  • {{.Names}} - {{.Status}}" | head -6
echo ""

# Exit if network-only mode
if [ "$NETWORK_ONLY" = true ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ Network started successfully (without chaincode)${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Next: Deploy chaincode with:"
    echo "  ./deploy-chaincode.sh"
    exit 0
fi

# Step 6: Set peer environment for chaincode operations
echo -e "${YELLOW}[5/8]${NC} Setting up peer environment..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
print_status "Peer environment configured for Org1"
echo ""

# Step 7: Deploy chaincode using network.sh
echo -e "${YELLOW}[6/8]${NC} Deploying TRACIENT chaincode v${CHAINCODE_VERSION}..."
print_info "This may take a few minutes..."

# Get next sequence number if chaincode already committed
COMMITTED=$(peer lifecycle chaincode querycommitted -C $CHANNEL_NAME -n $CHAINCODE_NAME 2>&1 || true)
if echo "$COMMITTED" | grep -q "Version:"; then
    CURRENT_SEQ=$(echo "$COMMITTED" | grep "Sequence:" | awk '{print $2}' | tr -d ',')
    CHAINCODE_SEQUENCE=$((CURRENT_SEQ + 1))
    print_info "Upgrading chaincode. New sequence: $CHAINCODE_SEQUENCE"
fi

./network.sh deployCC -ccn $CHAINCODE_NAME -ccp $CHAINCODE_PATH -ccl go -ccv $CHAINCODE_VERSION -ccs $CHAINCODE_SEQUENCE

if [ $? -eq 0 ]; then
    print_status "Chaincode deployed successfully"
else
    print_error "Chaincode deployment failed"
    exit 1
fi
echo ""

# Step 8: Initialize ledger
echo -e "${YELLOW}[7/8]${NC} Initializing ledger with sample data..."

# Set up TLS files for invoke
ORDERER_CA="${NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
ORG1_PEER_TLSROOTCERT="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
ORG2_PEER_TLSROOTCERT="${NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls \
    --cafile "$ORDERER_CA" \
    -C $CHANNEL_NAME \
    -n $CHAINCODE_NAME \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles "$ORG1_PEER_TLSROOTCERT" \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles "$ORG2_PEER_TLSROOTCERT" \
    -c '{"function":"InitLedger","Args":[]}' \
    2>&1 | grep -v "^$" || true

print_status "Ledger initialized"
echo ""

# Step 9: Generate environment setup script
echo -e "${YELLOW}[8/8]${NC} Generating environment setup script..."

cat > "${SCRIPT_DIR}/set-env.sh" << ENVEOF
#!/bin/bash
# TRACIENT Environment Setup Script
# Source this file: source ./set-env.sh

SCRIPT_DIR="\$( cd "\$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
export PATH="\${SCRIPT_DIR}/network/bin:\$PATH"
export FABRIC_CFG_PATH="\${SCRIPT_DIR}/network/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="\${SCRIPT_DIR}/network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="\${SCRIPT_DIR}/network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

echo "✓ TRACIENT environment configured for Org1"
echo "  CORE_PEER_ADDRESS: \$CORE_PEER_ADDRESS"
echo "  CORE_PEER_LOCALMSPID: \$CORE_PEER_LOCALMSPID"
ENVEOF

chmod +x "${SCRIPT_DIR}/set-env.sh"
print_status "Environment script created: set-env.sh"
echo ""

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      TRACIENT Blockchain Network Ready!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Network Information:${NC}"
echo "  • Channel: $CHANNEL_NAME"
echo "  • Chaincode: $CHAINCODE_NAME v$CHAINCODE_VERSION"
echo "  • Organizations: Org1MSP, Org2MSP"
echo ""
echo -e "${CYAN}Running Containers:${NC}"
docker ps --filter "name=peer0\|orderer\|ca\|dev-peer" --format "  • {{.Names}}" | head -8
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Source environment: source ./set-env.sh"
echo "  2. Test chaincode:     ./test-chaincode.sh"
echo "  3. Quick queries:"
echo "     peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"WAGE001\"]}'"
echo ""
echo -e "${CYAN}Available Scripts:${NC}"
echo "  • ./restart-network.sh  - Restart without losing data"
echo "  • ./fresh-start.sh      - Complete cleanup and restart"
echo "  • ./deploy-chaincode.sh - Redeploy chaincode only"
echo "  • ./test-chaincode.sh   - Test all 24 functions"
echo ""
