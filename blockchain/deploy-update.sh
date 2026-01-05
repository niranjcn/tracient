#!/bin/bash

export PATH=/usr/local/go/bin:/mnt/e/Major-Project/blockchain/network/bin:$PATH
export FABRIC_CFG_PATH=/mnt/e/Major-Project/blockchain/network/config
cd /mnt/e/Major-Project/blockchain/network/test-network

CC_PACKAGE_ID="tracient_2.1:1a54e8511ae6c7d35645c53332a890bddaf97f873a0d74cab32355683a9a4c9d"
ORDERER_CA=/mnt/e/Major-Project/blockchain/network/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo "=== Approving chaincode for Org1 ==="
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name tracient --version 2.1 --package-id $CC_PACKAGE_ID --sequence 2 --tls --cafile $ORDERER_CA

echo "=== Approving chaincode for Org2 ==="
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name tracient --version 2.1 --package-id $CC_PACKAGE_ID --sequence 2 --tls --cafile $ORDERER_CA

echo "=== Checking commit readiness ==="
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name tracient --version 2.1 --sequence 2 --tls --cafile $ORDERER_CA --output json

echo "=== Committing chaincode ==="
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --channelID mychannel --name tracient --version 2.1 --sequence 2 --tls --cafile $ORDERER_CA --peerAddresses localhost:7051 --tlsRootCertFiles /mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles /mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

echo "=== Chaincode deployment complete ==="
peer lifecycle chaincode querycommitted --channelID mychannel --name tracient
