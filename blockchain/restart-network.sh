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
else
  echo ""
  echo "❌ Expected 6 containers, found $RUNNING"
  echo "Run: ./start-network.sh --clean"
fi
