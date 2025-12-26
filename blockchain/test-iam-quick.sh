#!/bin/bash

# Quick IAM Test Script for Tracient Chaincode
# This script tests the actual IAM-enabled functions

# Set up environment
export PATH=$PATH:/mnt/e/Major-Project/fabric-samples/bin
cd /mnt/e/Major-Project/blockchain/network/test-network

export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

echo "=========================================="
echo "TRACIENT IAM VERIFICATION TESTS"
echo "=========================================="

echo ""
echo "1. Testing InitLedger..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem -c '{"function":"InitLedger","Args":[]}'
echo ""

echo "2. Testing ReadWage..."
peer chaincode query -C mychannel -n tracient -c '{"function":"ReadWage","Args":["WAGE-001"]}'
echo ""

echo "3. Testing QueryWagesByWorker..."
peer chaincode query -C mychannel -n tracient -c '{"function":"QueryWagesByWorker","Args":["worker1hash"]}'
echo ""

echo "4. Testing RegisterUser..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem -c '{"function":"RegisterUser","Args":["U-IAM-001","userhash001","worker","Org1MSP","John Doe","contacthash001"]}'
echo ""

echo "5. Testing GetUserProfile..."
peer chaincode query -C mychannel -n tracient -c '{"function":"GetUserProfile","Args":["userhash001"]}'
echo ""

echo "6. Testing RecordWage..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem -c '{"function":"RecordWage","Args":["WAGE-IAM-001","workerhash123","employerhash456","15000","INR","construction","2024-01-15T10:30:00Z","v1.0"]}'
echo ""

echo "7. Testing GetPovertyThreshold..."
peer chaincode query -C mychannel -n tracient -c '{"function":"GetPovertyThreshold","Args":["Maharashtra","BPL"]}'
echo ""

echo "=========================================="
echo "IAM VERIFICATION COMPLETE"
echo "=========================================="
