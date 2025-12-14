#!/bin/bash
#
# TRACIENT Blockchain - Quick Restart
# 
# Use this when network is already set up and you just need to start it again.
# This assumes certificates and chaincode are already deployed.
#

set -e

echo "🚀 Starting TRACIENT Blockchain Network..."
echo ""

cd /mnt/e/Major-Project/blockchain/network/test-network

# Check if containers are already running
if docker ps | grep -q "hyperledger/fabric"; then
  echo "⚠️  Network is already running!"
  docker ps --filter "label=service=hyperledger-fabric" --format "  • {{.Names}} - {{.Status}}"
  exit 0
fi

# Start the docker containers
echo "📦 Starting Fabric containers..."
docker-compose -f compose/compose-ca.yaml -f compose/compose-test-net.yaml up -d

# Wait a moment for containers to be ready
echo "⏳ Waiting for containers to start..."
sleep 5

# Check status
RUNNING=$(docker ps --filter "label=service=hyperledger-fabric" --format "{{.Names}}" | wc -l)

if [ "$RUNNING" -eq 6 ]; then
  echo ""
  echo "✅ TRACIENT Blockchain Network is running!"
  echo ""
  echo "Running containers:"
  docker ps --filter "label=service=hyperledger-fabric" --format "  • {{.Names}}"
  echo ""
  echo "Ready for transactions! 🎉"
  echo ""
  echo "🔧 Setting up environment variables for Org1..."
  
  # Export environment variables for peer CLI
  export FABRIC_CFG_PATH=/mnt/e/Major-Project/blockchain/network/test-network/../config/
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
  export CORE_PEER_ADDRESS=localhost:7051
  
  echo "✅ Environment configured for Org1"
  echo ""
  echo "📋 You can now use peer commands:"
  echo "   peer channel list"
  echo "   peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"WAGE001\"]}'"
  echo ""
else
  echo ""
  echo "❌ Expected 6 containers, found $RUNNING"
  echo "Run: ./start-network.sh --clean"
fi
