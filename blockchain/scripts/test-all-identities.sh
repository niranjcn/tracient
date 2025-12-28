#!/bin/bash
#
# Comprehensive Identity & Access Control Test Script for Tracient
# Tests all identities based on actual access rules
#

cd /mnt/e/Major-Project/fabric-samples/test-network

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths
NETWORK_PATH="/mnt/e/Major-Project/fabric-samples/test-network"
ORG1_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org1.example.com"
ORG2_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org2.example.com"
export PATH="${NETWORK_PATH}/../bin:$PATH"
export FABRIC_CFG_PATH="${NETWORK_PATH}/../config/"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Set identity environment
setIdentity() {
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

invoke_cc() {
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls \
        --cafile "${NETWORK_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C mychannel -n tracient \
        --peerAddresses localhost:7051 --tlsRootCertFiles ${ORG1_PATH}/tlsca/tlsca.org1.example.com-cert.pem \
        --peerAddresses localhost:9051 --tlsRootCertFiles ${ORG2_PATH}/tlsca/tlsca.org2.example.com-cert.pem \
        -c "$1" 2>&1
}

query_cc() {
    peer chaincode query -C mychannel -n tracient -c "$1" 2>&1
}

# Test function - expects success
test_success() {
    local name=$1
    local result=$2
    echo -n "[TEST] ${name}... "
    if echo "$result" | grep -qi "status:200\|status:VALID" || ([ $? -eq 0 ] && ! echo "$result" | grep -qi "access denied\|error"); then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    fi
    # Check if it's a query success (JSON response)
    if echo "$result" | grep -qE '^\{|\[' && ! echo "$result" | grep -qi "error"; then
        echo -e "${GREEN}PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    fi
    echo -e "${RED}FAILED${NC}"
    echo "    Output: ${result:0:120}"
    ((TESTS_FAILED++))
    return 1
}

# Test function - expects denial
test_denied() {
    local name=$1
    local result=$2
    echo -n "[TEST] ${name}... "
    if echo "$result" | grep -qi "access denied"; then
        echo -e "${GREEN}PASSED (Correctly Denied)${NC}"
        ((TESTS_PASSED++))
        return 0
    fi
    echo -e "${RED}FAILED (Should have been denied)${NC}"
    echo "    Output: ${result:0:120}"
    ((TESTS_FAILED++))
    return 1
}

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TRACIENT COMPREHENSIVE IAM TEST SUITE                                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. ADMIN TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  1. ADMIN (Admin@org1.example.com) - Should have FULL access${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
setIdentity "Admin@org1.example.com" "1"

result=$(query_cc '{"function":"ReadWage","Args":["WAGE001"]}')
test_success "Admin: ReadWage" "$result"

result=$(invoke_cc '{"function":"SetPovertyThreshold","Args":["Delhi","BPL","175000","admin"]}')
test_success "Admin: SetPovertyThreshold" "$result"

result=$(query_cc '{"function":"GetPovertyThreshold","Args":["Delhi","BPL"]}')
test_success "Admin: GetPovertyThreshold" "$result"

result=$(query_cc '{"function":"QueryWagesByWorker","Args":["worker-001"]}')
test_success "Admin: QueryWagesByWorker" "$result"

# ============================================
# 2. GOVERNMENT OFFICIAL TESTS
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  2. GOVERNMENT OFFICIAL (govtofficial1) - High access${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
setIdentity "govtofficial1" "1"

result=$(query_cc '{"function":"ReadWage","Args":["WAGE001"]}')
test_success "GovtOfficial: ReadWage" "$result"

result=$(invoke_cc '{"function":"SetPovertyThreshold","Args":["Maharashtra","BPL","185000","govtofficial"]}')
test_success "GovtOfficial: SetPovertyThreshold" "$result"

result=$(query_cc '{"function":"QueryWagesByWorker","Args":["worker-001"]}')
test_success "GovtOfficial: QueryWagesByWorker" "$result"

result=$(query_cc '{"function":"QueryWagesByEmployer","Args":["employer-001"]}')
test_success "GovtOfficial: QueryWagesByEmployer" "$result"

# ============================================
# 3. AUDITOR TESTS
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  3. AUDITOR (auditor1) - Read-only access${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
setIdentity "auditor1" "1"

result=$(query_cc '{"function":"ReadWage","Args":["WAGE001"]}')
test_success "Auditor: ReadWage (should succeed)" "$result"

result=$(query_cc '{"function":"QueryWagesByWorker","Args":["worker-001"]}')
test_success "Auditor: QueryWagesByWorker (should succeed)" "$result"

# Auditor should NOT be able to record wages
result=$(invoke_cc '{"function":"RecordWage","Args":["WAGE-AUD-001","worker-hash","emp-hash","50000","INR","full_time","2024-02-01T10:00:00Z","v1.0"]}')
test_denied "Auditor: RecordWage (should be DENIED)" "$result"

# Auditor should NOT be able to set thresholds
result=$(invoke_cc '{"function":"SetPovertyThreshold","Args":["Gujarat","BPL","160000","auditor"]}')
test_denied "Auditor: SetPovertyThreshold (should be DENIED)" "$result"

# ============================================
# 4. BANK OFFICER TESTS
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  4. BANK OFFICER (bankofficer1) - Limited access${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
setIdentity "bankofficer1" "1"

result=$(query_cc '{"function":"ReadWage","Args":["WAGE001"]}')
test_success "BankOfficer: ReadWage (should succeed)" "$result"

# Bank officer should NOT be able to record wages
result=$(invoke_cc '{"function":"RecordWage","Args":["WAGE-BANK-001","worker-hash","emp-hash","50000","INR","full_time","2024-02-01T10:00:00Z","v1.0"]}')
test_denied "BankOfficer: RecordWage (should be DENIED)" "$result"

# Bank officer should NOT be able to set thresholds
result=$(invoke_cc '{"function":"SetPovertyThreshold","Args":["Punjab","BPL","165000","bank"]}')
test_denied "BankOfficer: SetPovertyThreshold (should be DENIED)" "$result"

# ============================================
# 5. EMPLOYER TESTS
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  5. EMPLOYER (employer1) - Can record wages${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
setIdentity "employer1" "2"

result=$(query_cc '{"function":"ReadWage","Args":["WAGE001"]}')
test_success "Employer: ReadWage (should succeed)" "$result"

# Create unique wage ID to avoid conflicts
UNIQUE_WAGE_ID="WAGE-EMP-$(date +%s)"
result=$(invoke_cc "{\"function\":\"RecordWage\",\"Args\":[\"${UNIQUE_WAGE_ID}\",\"worker-emp-001\",\"emp-001\",\"42000\",\"INR\",\"full_time\",\"2024-02-15T10:00:00Z\",\"v1.0\"]}")
test_success "Employer: RecordWage (should succeed)" "$result"

result=$(query_cc '{"function":"QueryWagesByEmployer","Args":["emp-001"]}')
test_success "Employer: QueryWagesByEmployer (should succeed)" "$result"

# Employer should NOT be able to set thresholds
result=$(invoke_cc '{"function":"SetPovertyThreshold","Args":["Karnataka","BPL","170000","employer"]}')
test_denied "Employer: SetPovertyThreshold (should be DENIED)" "$result"

# Employer should NOT be able to register users (Org2 restriction)
result=$(invoke_cc '{"function":"RegisterUser","Args":["TEST001","TESTHASH","worker","Org2","Test","contact"]}')
test_denied "Employer: RegisterUser (should be DENIED - Org2)" "$result"

# ============================================
# 6. WORKER TESTS
# ============================================
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  6. WORKER (worker1) - Most restricted access${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
setIdentity "worker1" "2"

result=$(query_cc '{"function":"ReadWage","Args":["WAGE001"]}')
test_success "Worker: ReadWage (should succeed)" "$result"

result=$(query_cc '{"function":"QueryWagesByWorker","Args":["worker-001"]}')
test_success "Worker: QueryWagesByWorker (should succeed)" "$result"

# Worker should NOT be able to record wages
result=$(invoke_cc '{"function":"RecordWage","Args":["WAGE-WRK-001","worker-hash","emp-hash","30000","INR","part_time","2024-02-01T10:00:00Z","v1.0"]}')
test_denied "Worker: RecordWage (should be DENIED)" "$result"

# Worker should NOT be able to set thresholds
result=$(invoke_cc '{"function":"SetPovertyThreshold","Args":["Bihar","BPL","140000","worker"]}')
test_denied "Worker: SetPovertyThreshold (should be DENIED)" "$result"

# Worker should NOT be able to query employer data
result=$(query_cc '{"function":"QueryWagesByEmployer","Args":["employer-001"]}')
test_denied "Worker: QueryWagesByEmployer (should be DENIED)" "$result"

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                           TEST RESULTS                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo -e "  Total Tests:  ${TOTAL}"
echo -e "  Passed:       ${GREEN}${TESTS_PASSED}${NC}"
echo -e "  Failed:       ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ALL TESTS PASSED! IAM IS WORKING CORRECTLY! ✓                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║           Some tests failed. Review results above.                        ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "${BLUE}Permission Matrix Summary:${NC}"
echo "┌──────────────────────────┬───────┬───────┬─────────┬───────┬──────────┬────────┐"
echo "│ Function                 │ Admin │ Govt  │ Auditor │ Bank  │ Employer │ Worker │"
echo "├──────────────────────────┼───────┼───────┼─────────┼───────┼──────────┼────────┤"
echo "│ ReadWage                 │ ✓     │ ✓     │ ✓       │ ✓     │ ✓        │ ✓      │"
echo "│ RecordWage               │ ✓     │ ✗     │ ✗       │ ✗     │ ✓        │ ✗      │"
echo "│ SetPovertyThreshold      │ ✓     │ ✓     │ ✗       │ ✗     │ ✗        │ ✗      │"
echo "│ QueryWagesByWorker       │ ✓     │ ✓     │ ✓       │ ✗     │ ✓        │ ✓      │"
echo "│ QueryWagesByEmployer     │ ✓     │ ✓     │ ✓       │ ✗     │ ✓        │ ✗      │"
echo "│ RegisterUser             │ ✓     │ ✓     │ ✗       │ ✗     │ ✗        │ ✗      │"
echo "└──────────────────────────┴───────┴───────┴─────────┴───────┴──────────┴────────┘"
echo ""
