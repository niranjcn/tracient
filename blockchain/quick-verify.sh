#!/bin/bash
# Quick verification test
cd /mnt/e/Major-Project/blockchain
source ./set-env.sh

echo "=========================================="
echo "  TRACIENT Chaincode Quick Verification"
echo "=========================================="
echo ""

echo "1. Testing ReadWage (WAGE001)..."
peer chaincode query -C mychannel -n tracient -c '{"function":"ReadWage","Args":["WAGE001"]}'
echo ""

echo "2. Testing WageExists..."
peer chaincode query -C mychannel -n tracient -c '{"function":"WageExists","Args":["WAGE001"]}'
echo ""

echo "3. Testing QueryWagesByWorker..."
peer chaincode query -C mychannel -n tracient -c '{"function":"QueryWagesByWorker","Args":["worker-001"]}'
echo ""

echo "4. Testing GetPovertyThreshold (BPL category)..."
peer chaincode query -C mychannel -n tracient -c '{"function":"GetPovertyThreshold","Args":["DEFAULT","BPL"]}'
echo ""

echo "5. Testing CheckPovertyStatus..."
peer chaincode query -C mychannel -n tracient -c '{"function":"CheckPovertyStatus","Args":["worker-001","DEFAULT","2024-01-01","2025-12-31"]}'
echo ""

echo "6. Testing CalculateTotalIncome..."
peer chaincode query -C mychannel -n tracient -c '{"function":"CalculateTotalIncome","Args":["worker-001","2024-01-01","2025-12-31"]}'
echo ""

echo "7. Testing RegisterUser (invoke)..."
ORDERER_CA="/mnt/e/Major-Project/blockchain/network/test-network/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"
ORG1_TLSROOTCERT="/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem"
ORG2_TLSROOTCERT="/mnt/e/Major-Project/blockchain/network/test-network/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem"

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles "$ORG1_TLSROOTCERT" --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_TLSROOTCERT" -c '{"function":"RegisterUser","Args":["test-user-001","test_user_hash","worker","Org1MSP","Test User","contact_hash"]}'
sleep 2
echo ""

echo "8. Testing GetUserProfile (using userIDHash, not userID)..."
peer chaincode query -C mychannel -n tracient -c '{"function":"GetUserProfile","Args":["test_user_hash"]}'
echo ""

echo "9. Testing UserExists (using userIDHash)..."
peer chaincode query -C mychannel -n tracient -c '{"function":"UserExists","Args":["test_user_hash"]}'
echo ""

echo "10. Testing FlagAnomaly (invoke)..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles "$ORG1_TLSROOTCERT" --peerAddresses localhost:9051 --tlsRootCertFiles "$ORG2_TLSROOTCERT" -c '{"function":"FlagAnomaly","Args":["WAGE001","0.85","Unusual amount for job type","ai_model_v1"]}'
sleep 2
echo ""

echo "11. Testing GetFlaggedWages..."
peer chaincode query -C mychannel -n tracient -c '{"function":"GetFlaggedWages","Args":["0.5"]}'
echo ""

echo "=========================================="
echo "  Verification Complete!"
echo "=========================================="
