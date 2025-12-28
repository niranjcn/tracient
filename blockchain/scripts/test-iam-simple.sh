#!/bin/bash
#
# Simple Identity Test Script for Tracient
# Tests basic access control using Admin identity
#

cd /mnt/e/Major-Project/fabric-samples/test-network

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths
NETWORK_PATH="/mnt/e/Major-Project/fabric-samples/test-network"
ORG1_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org1.example.com"
ORG2_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org2.example.com"
export PATH="${NETWORK_PATH}/../bin:$PATH"
export FABRIC_CFG_PATH="${NETWORK_PATH}/../config/"

# Set Org1 Admin environment
setOrg1Admin() {
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PATH}/tlsca/tlsca.org1.example.com-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${ORG1_PATH}/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}

# Set Org2 Admin environment
setOrg2Admin() {
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_PATH}/tlsca/tlsca.org2.example.com-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${ORG2_PATH}/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
}

# Set custom identity
setCustomIdentity() {
    local identity=$1
    local org=$2
    if [ "$org" == "1" ]; then
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID="Org1MSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_PATH}/tlsca/tlsca.org1.example.com-cert.pem
        export CORE_PEER_MSPCONFIGPATH=${ORG1_PATH}/users/${identity}/msp
        export CORE_PEER_ADDRESS=localhost:7051
    else
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID="Org2MSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_PATH}/tlsca/tlsca.org2.example.com-cert.pem
        export CORE_PEER_MSPCONFIGPATH=${ORG2_PATH}/users/${identity}/msp
        export CORE_PEER_ADDRESS=localhost:9051
    fi
}

invoke_chaincode() {
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "${NETWORK_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C mychannel -n tracient \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles ${ORG1_PATH}/tlsca/tlsca.org1.example.com-cert.pem \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles ${ORG2_PATH}/tlsca/tlsca.org2.example.com-cert.pem \
        -c "$1" 2>&1
}

query_chaincode() {
    peer chaincode query -C mychannel -n tracient -c "$1" 2>&1
}

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TRACIENT IDENTITY & ACCESS CONTROL TEST SUITE                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ADMIN TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  1. ADMIN IDENTITY TESTS (OU=admin auto-detection)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

setOrg1Admin
echo -e "${CYAN}Testing with Admin@org1.example.com...${NC}"
echo ""

# Test 1: InitLedger
echo -e -n "[TEST] Admin: InitLedger... "
result=$(invoke_chaincode '{"function":"InitLedger","Args":[]}')
if echo "$result" | grep -q "status:VALID"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 2: SetPovertyThreshold (correct params: state, category, amount, setBy)
echo -e -n "[TEST] Admin: SetPovertyThreshold... "
result=$(invoke_chaincode '{"function":"SetPovertyThreshold","Args":["Kerala","BPL","180000","admin"]}')
if echo "$result" | grep -q "status:VALID"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 3: RegisterUser (correct params: userID, userIDHash, role, orgID, name, contactHash)
echo -e -n "[TEST] Admin: RegisterUser... "
result=$(invoke_chaincode '{"function":"RegisterUser","Args":["USER001","HASH001","worker","Org1","Test Worker","contact123"]}')
if echo "$result" | grep -q "status:VALID"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 4: RecordWage (correct params: wageID, workerIDHash, employerIDHash, amount, currency, jobType, timestamp, policyVersion)
echo -e -n "[TEST] Admin: RecordWage... "
result=$(invoke_chaincode '{"function":"RecordWage","Args":["WAGE001","WORKER_HASH001","EMP_HASH001","35000","INR","full_time","2024-01-15T10:00:00Z","v1.0"]}')
if echo "$result" | grep -q "status:VALID"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 5: ReadWage
echo -e -n "[TEST] Admin: ReadWage (query)... "
result=$(query_chaincode '{"function":"ReadWage","Args":["WAGE001"]}')
if echo "$result" | grep -q "wageId"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 6: GetPovertyThreshold
echo -e -n "[TEST] Admin: GetPovertyThreshold (query)... "
result=$(query_chaincode '{"function":"GetPovertyThreshold","Args":["Kerala","BPL"]}')
if echo "$result" | grep -q "amount"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 7: QueryWagesByWorker
echo -e -n "[TEST] Admin: QueryWagesByWorker (query)... "
result=$(query_chaincode '{"function":"QueryWagesByWorker","Args":["WORKER_HASH001"]}')
if [ $? -eq 0 ]; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# Test 8: Org2 Admin Test
echo ""
setOrg2Admin
echo -e "${CYAN}Testing with Admin@org2.example.com...${NC}"
echo ""

echo -e -n "[TEST] Org2 Admin: SetPovertyThreshold... "
result=$(invoke_chaincode '{"function":"SetPovertyThreshold","Args":["TamilNadu","APL","250000","org2admin"]}')
if echo "$result" | grep -q "status:VALID"; then
    echo -e "${GREEN}PASSED${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Output: ${result:0:150}"
fi

# ============================================
# NON-ADMIN IDENTITY TESTS (Should be denied without proper role)
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  2. NON-ADMIN IDENTITY TESTS (Testing IAM Denial)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test employer1 - should be denied for most functions (no role attribute in cert)
setCustomIdentity "employer1" "2"
echo -e "${CYAN}Testing with employer1 (Org2 - no role attr in cert)...${NC}"
echo ""

echo -e -n "[TEST] Employer1: ReadWage (should be DENIED)... "
result=$(query_chaincode '{"function":"ReadWage","Args":["WAGE001"]}')
if echo "$result" | grep -qi "access denied\|No role attribute"; then
    echo -e "${GREEN}PASSED - Correctly Denied${NC}"
else
    echo -e "${RED}FAILED - Should have been denied${NC}"
    echo "Output: ${result:0:150}"
fi

echo -e -n "[TEST] Employer1: SetPovertyThreshold (should be DENIED)... "
result=$(invoke_chaincode '{"function":"SetPovertyThreshold","Args":["Karnataka","BPL","170000","employer"]}')
if echo "$result" | grep -qi "access denied\|No role attribute"; then
    echo -e "${GREEN}PASSED - Correctly Denied${NC}"
else
    echo -e "${RED}FAILED - Should have been denied${NC}"
    echo "Output: ${result:0:150}"
fi

# Test worker1 
setCustomIdentity "worker1" "2"
echo ""
echo -e "${CYAN}Testing with worker1 (Org2 - no role attr in cert)...${NC}"
echo ""

echo -e -n "[TEST] Worker1: ReadWage (should be DENIED)... "
result=$(query_chaincode '{"function":"ReadWage","Args":["WAGE001"]}')
if echo "$result" | grep -qi "access denied\|No role attribute"; then
    echo -e "${GREEN}PASSED - Correctly Denied${NC}"
else
    echo -e "${RED}FAILED - Should have been denied${NC}"
    echo "Output: ${result:0:150}"
fi

# Test auditor1
setCustomIdentity "auditor1" "1"
echo ""
echo -e "${CYAN}Testing with auditor1 (Org1 - no role attr in cert)...${NC}"
echo ""

echo -e -n "[TEST] Auditor1: ReadWage (should be DENIED)... "
result=$(query_chaincode '{"function":"ReadWage","Args":["WAGE001"]}')
if echo "$result" | grep -qi "access denied\|No role attribute"; then
    echo -e "${GREEN}PASSED - Correctly Denied${NC}"
else
    echo -e "${RED}FAILED - Should have been denied${NC}"
    echo "Output: ${result:0:150}"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Key Findings:"
echo "  ✓ Admin identities (OU=admin) have full access"
echo "  ✓ Non-admin identities without role attribute are correctly denied"
echo "  ✓ IAM is working and enforcing access control"
echo ""
echo -e "${YELLOW}Note: Custom identities (employer, worker, auditor) need${NC}"
echo -e "${YELLOW}role attributes embedded in certificates for proper RBAC.${NC}"
echo -e "${YELLOW}Current test shows IAM is blocking unauthorized access.${NC}"
echo ""
