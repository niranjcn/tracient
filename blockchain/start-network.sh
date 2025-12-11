#!/bin/bash
#
# TRACIENT Blockchain Network Startup Script
# 
# This script starts the Hyperledger Fabric network and deploys the TRACIENT chaincode.
# Use this when the network has been stopped or you're starting fresh.
#
# Usage:
#   ./start-network.sh                    # Full setup (network + chaincode)
#   ./start-network.sh --network-only     # Only start network, skip chaincode
#   ./start-network.sh --clean            # Clean start (removes old data)
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NETWORK_DIR="/mnt/e/Major-Project/blockchain/network/test-network"
CHAINCODE_PATH="../../chaincode/tracient"
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="tracient"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"

# Package ID (set after installation)
CC_PACKAGE_ID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TRACIENT Blockchain Network Startup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Parse command line arguments
NETWORK_ONLY=false
CLEAN_START=false

for arg in "$@"; do
  case $arg in
    --network-only)
      NETWORK_ONLY=true
      shift
      ;;
    --clean)
      CLEAN_START=true
      shift
      ;;
    --help)
      echo "Usage: ./start-network.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --network-only    Start network only (skip chaincode deployment)"
      echo "  --clean           Clean start (remove all existing data)"
      echo "  --help            Show this help message"
      exit 0
      ;;
  esac
done

# Function to print status
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

# Check prerequisites
echo -e "${YELLOW}[1/8]${NC} Checking prerequisites..."

if ! command -v docker &> /dev/null; then
  print_error "Docker not found. Please install Docker Desktop."
  exit 1
fi

if ! command -v peer &> /dev/null; then
  print_warning "Peer command not in PATH. Adding Fabric binaries to PATH..."
  export PATH=/mnt/e/Major-Project/blockchain/network/bin:$PATH
fi

if ! command -v go &> /dev/null; then
  print_error "Go not found. Please install Go 1.25+."
  exit 1
fi

if ! docker ps &> /dev/null; then
  print_error "Docker daemon not running or permission denied."
  print_info "Run: sudo usermod -aG docker \$USER && newgrp docker"
  exit 1
fi

print_status "Prerequisites OK"
echo ""

# Navigate to network directory
cd "$NETWORK_DIR" || { print_error "Network directory not found"; exit 1; }

# Set environment variables
print_info "Setting up environment variables..."
export PATH=/mnt/e/Major-Project/blockchain/network/bin:$PATH
export FABRIC_CFG_PATH=/mnt/e/Major-Project/blockchain/network/config
print_status "Environment configured"
echo ""

# Clean start if requested
if [ "$CLEAN_START" = true ]; then
  echo -e "${YELLOW}[2/8]${NC} Cleaning previous network data..."
  ./network.sh down
  rm -f tracient.tar.gz
  print_status "Cleanup complete"
  echo ""
else
  echo -e "${YELLOW}[2/8]${NC} Checking existing network..."
  if docker ps | grep -q "hyperledger/fabric"; then
    print_warning "Network is already running"
    read -p "Do you want to restart? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      ./network.sh down
      print_status "Network stopped"
    else
      print_info "Skipping network startup"
      if [ "$NETWORK_ONLY" = true ]; then
        echo -e "${GREEN}Done!${NC}"
        exit 0
      fi
      # Skip to chaincode deployment
      SKIP_NETWORK=true
    fi
  fi
  echo ""
fi

# Start the network
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

# Verify network is running
echo -e "${YELLOW}[4/8]${NC} Verifying network status..."
RUNNING_CONTAINERS=$(docker ps --filter "label=service=hyperledger-fabric" --format "{{.Names}}" | wc -l)
if [ "$RUNNING_CONTAINERS" -lt 6 ]; then
  print_error "Expected 6 containers, found $RUNNING_CONTAINERS"
  print_info "Check logs: docker ps -a"
  exit 1
fi
print_status "All containers running ($RUNNING_CONTAINERS/6)"
echo ""

# Exit if network-only mode
if [ "$NETWORK_ONLY" = true ]; then
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Network started successfully!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "Running containers:"
  docker ps --filter "label=service=hyperledger-fabric" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  echo ""
  echo "Next steps:"
  echo "  - Deploy chaincode: ./start-network.sh (without --network-only)"
  echo "  - Check status: docker ps"
  echo "  - View logs: docker logs <container-name>"
  exit 0
fi

# Package chaincode
echo -e "${YELLOW}[5/8]${NC} Packaging TRACIENT chaincode..."
if [ -f "tracient.tar.gz" ]; then
  print_warning "Package already exists. Using existing package."
else
  peer lifecycle chaincode package tracient.tar.gz \
    --path $CHAINCODE_PATH \
    --lang golang \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
  
  if [ $? -eq 0 ]; then
    print_status "Chaincode packaged: tracient.tar.gz"
  else
    print_error "Failed to package chaincode"
    exit 1
  fi
fi
echo ""

# Install on Org1
echo -e "${YELLOW}[6/8]${NC} Installing chaincode on Org1..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode install tracient.tar.gz

if [ $? -eq 0 ]; then
  print_status "Chaincode installed on Org1"
  # Extract package ID
  CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "${CHAINCODE_NAME}_${CHAINCODE_VERSION}" | awk '{print $3}' | sed 's/,$//')
  print_info "Package ID: $CC_PACKAGE_ID"
else
  print_error "Failed to install chaincode on Org1"
  exit 1
fi
echo ""

# Install on Org2
echo -e "${YELLOW}[7/8]${NC} Installing chaincode on Org2..."
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode install tracient.tar.gz

if [ $? -eq 0 ]; then
  print_status "Chaincode installed on Org2"
else
  print_error "Failed to install chaincode on Org2"
  exit 1
fi
echo ""

# Approve for Org2
echo -e "${YELLOW}[8/8]${NC} Approving and committing chaincode..."
print_info "Step 1/4: Approve for Org2..."

peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $CC_PACKAGE_ID \
  --sequence $CHAINCODE_SEQUENCE \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

if [ $? -eq 0 ]; then
  print_status "Org2 approved"
else
  print_error "Org2 approval failed"
  exit 1
fi

# Approve for Org1
print_info "Step 2/4: Approve for Org1..."
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $CC_PACKAGE_ID \
  --sequence $CHAINCODE_SEQUENCE \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

if [ $? -eq 0 ]; then
  print_status "Org1 approved"
else
  print_error "Org1 approval failed"
  exit 1
fi

# Check commit readiness
print_info "Step 3/4: Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence $CHAINCODE_SEQUENCE \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --output json | grep -q '"Org1MSP": true' && grep -q '"Org2MSP": true'

if [ $? -eq 0 ]; then
  print_status "Both organizations approved"
else
  print_warning "Approval status unclear, proceeding with commit..."
fi

# Commit chaincode
print_info "Step 4/4: Committing chaincode to channel..."
peer lifecycle chaincode commit -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence $CHAINCODE_SEQUENCE \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"

if [ $? -eq 0 ]; then
  print_status "Chaincode committed successfully"
else
  print_error "Chaincode commit failed"
  exit 1
fi
echo ""

# Verify deployment
echo "Verifying chaincode deployment..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME

if [ $? -eq 0 ]; then
  print_status "Chaincode deployment verified"
else
  print_warning "Could not verify chaincode deployment"
fi
echo ""

# Success summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✓ TRACIENT Blockchain Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Network Status:"
echo "  • Channel: $CHANNEL_NAME"
echo "  • Chaincode: $CHAINCODE_NAME v$CHAINCODE_VERSION"
echo "  • Organizations: Org1MSP, Org2MSP"
echo "  • Package ID: $CC_PACKAGE_ID"
echo ""
echo "Running Containers:"
docker ps --filter "label=service=hyperledger-fabric" --format "  • {{.Names}} - {{.Status}}"
echo ""
echo "Test Commands:"
echo "  # Initialize ledger"
echo "  peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \\"
echo "    --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" \\"
echo "    -C $CHANNEL_NAME -n $CHAINCODE_NAME \\"
echo "    --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" \\"
echo "    --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" \\"
echo "    -c '{\"function\":\"InitLedger\",\"Args\":[]}'"
echo ""
echo "  # Query a wage record"
echo "  peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{\"Args\":[\"ReadWage\",\"WAGE001\"]}'"
echo ""
echo "Management Commands:"
echo "  • Stop network: ./network.sh down"
echo "  • View logs: docker logs <container-name>"
echo "  • Check status: docker ps"
echo ""
