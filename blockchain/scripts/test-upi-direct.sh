#!/bin/bash
# Test UPI read directly

cd /mnt/e/Major-Project/fabric-samples/test-network

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem

UPI_ID="NEW_UPI_$(date +%s)"

# Create one
echo "=== Recording UPI Transaction: $UPI_ID ==="
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile $ORDERER_CA \
    -C mychannel -n tracient \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
    -c "{\"function\":\"RecordUPITransaction\",\"Args\":[\"$UPI_ID\",\"worker123\",\"5000\",\"INR\",\"TestSender\",\"9876543210\",\"REF001\",\"UPI\"]}"

echo ""
echo "=== Waiting for commit ==="
sleep 3

echo ""
echo "=== Reading UPI Transaction ==="
peer chaincode query -C mychannel -n tracient -c "{\"function\":\"ReadUPITransaction\",\"Args\":[\"$UPI_ID\"]}"

echo ""
echo "=== Checking exists ==="
peer chaincode query -C mychannel -n tracient -c "{\"function\":\"UPITransactionExists\",\"Args\":[\"$UPI_ID\"]}"
