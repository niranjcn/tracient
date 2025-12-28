#!/bin/bash
# Diagnose identity issues

cd /mnt/e/Major-Project/fabric-samples/test-network

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem

setOrg1() {
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_ADDRESS=localhost:7051
}

setOrg2() {
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_ADDRESS=localhost:9051
}

echo "=== Testing bank_officer1 from Org1 ==="
setOrg1
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/bankofficer1/msp

echo "Testing simple query - WageExists"
peer chaincode query -C mychannel -n tracient -c '{"function":"WageExists","Args":["WAGE001"]}' 2>&1

echo ""
echo "Testing CalculateTotalIncome (clearance 2 required)"
peer chaincode query -C mychannel -n tracient -c '{"function":"CalculateTotalIncome","Args":["worker1","2025-01-01","2025-12-31"]}' 2>&1

echo ""
echo "=== Testing employer1 from Org2 ==="
setOrg2
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/employer1/msp

echo "Testing simple query - WageExists"
peer chaincode query -C mychannel -n tracient -c '{"function":"WageExists","Args":["WAGE001"]}' 2>&1

echo ""
echo "Testing CalculateTotalIncome (clearance 2 required)"
peer chaincode query -C mychannel -n tracient -c '{"function":"CalculateTotalIncome","Args":["worker1","2025-01-01","2025-12-31"]}' 2>&1

echo ""
echo "=== Testing worker1 from Org2 ==="
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/worker1/msp

echo "Testing simple query - WageExists"
peer chaincode query -C mychannel -n tracient -c '{"function":"WageExists","Args":["WAGE001"]}' 2>&1

echo ""
echo "Testing CalculateTotalIncome (clearance 2 required)"
peer chaincode query -C mychannel -n tracient -c '{"function":"CalculateTotalIncome","Args":["worker1","2025-01-01","2025-12-31"]}' 2>&1
