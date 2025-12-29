#!/bin/bash
#
# TRACIENT Chaincode Quick Test
# 
# Quick verification that the chaincode is working
#

# Auto-detect script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="${SCRIPT_DIR}/network/test-network"

# Set up environment
export PATH="${SCRIPT_DIR}/network/bin:$PATH"
export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

echo "=========================================="
echo "TRACIENT Chaincode Quick Tests"
echo "=========================================="
echo ""

echo "1. Testing ReadWage..."
peer chaincode query -C mychannel -n tracient -c '{"function":"ReadWage","Args":["WAGE001"]}'
echo ""

echo "2. Testing QueryWagesByWorker..."
peer chaincode query -C mychannel -n tracient -c '{"function":"QueryWagesByWorker","Args":["worker1hash"]}'
echo ""

echo "3. Testing CalculateTotalIncome..."
peer chaincode query -C mychannel -n tracient -c '{"function":"CalculateTotalIncome","Args":["worker1hash","2024-01-01T00:00:00Z","2024-12-31T23:59:59Z"]}'
echo ""

echo "4. Testing GetPovertyThreshold..."
peer chaincode query -C mychannel -n tracient -c '{"function":"GetPovertyThreshold","Args":["Maharashtra","BPL"]}'
echo ""

echo "5. Testing CheckPovertyStatus..."
peer chaincode query -C mychannel -n tracient -c '{"function":"CheckPovertyStatus","Args":["worker1hash","Maharashtra","2024","12"]}'
echo ""

echo "=========================================="
echo "Tests Complete"
echo "=========================================="
