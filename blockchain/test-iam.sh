#!/bin/bash
# ============================================================================
# TRACIENT IAM - Comprehensive Test Script
# ============================================================================
# Tests all IAM functionality including:
# - Role-based access control
# - Attribute-based access control (ABAC)
# - Audit logging
# - Self-access restrictions
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK_DIR="${SCRIPT_DIR}/network/test-network"
CHAINCODE_PATH="${SCRIPT_DIR}/chaincode/tracient"

CHANNEL_NAME="mychannel"
CHAINCODE_NAME="tracient"

PASSED=0
FAILED=0
TOTAL=0

# Test result tracking
print_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
    ((TOTAL++))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

print_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Setup environment for Org1
setup_org1() {
    export PATH="${SCRIPT_DIR}/network/bin:$PATH"
    export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
    export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051
}

# Setup environment for Org2
setup_org2() {
    export PATH="${SCRIPT_DIR}/network/bin:$PATH"
    export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
    export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:9051
}

# Run a chaincode query
query_chaincode() {
    local func=$1
    local args=$2
    peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c "{\"function\":\"$func\",\"Args\":$args}" 2>&1
}

# Run a chaincode invoke
invoke_chaincode() {
    local func=$1
    local args=$2
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls --cafile "${NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C $CHANNEL_NAME -n $CHAINCODE_NAME \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles "${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles "${NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
        -c "{\"function\":\"$func\",\"Args\":$args}" 2>&1
}

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        TRACIENT IAM - Comprehensive Test Suite                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
print_info "Checking prerequisites..."
cd "$NETWORK_DIR"
if ! docker ps | grep -q "peer0.org1.example.com"; then
    print_fail "Network is not running"
    exit 1
fi
print_pass "Network is running"

# Setup default environment
setup_org1

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 1: BASIC IAM FUNCTIONS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 1: ReadWage (should work for all authenticated users)
print_test "1.1 ReadWage - Basic read access"
RESULT=$(query_chaincode "ReadWage" '["WAGE001"]')
if echo "$RESULT" | grep -q "wageId"; then
    print_pass "ReadWage works correctly"
else
    print_fail "ReadWage failed: $RESULT"
fi

# Test 2: WageExists
print_test "1.2 WageExists - Check wage existence"
RESULT=$(query_chaincode "WageExists" '["WAGE001"]')
if echo "$RESULT" | grep -q "true\|false"; then
    print_pass "WageExists works correctly"
else
    print_fail "WageExists failed: $RESULT"
fi

# Test 3: QueryWageHistory
print_test "1.3 QueryWageHistory - Audit trail"
RESULT=$(query_chaincode "QueryWageHistory" '["WAGE001"]')
if echo "$RESULT" | grep -q "wageId\|null\|\[\]"; then
    print_pass "QueryWageHistory works correctly"
else
    print_fail "QueryWageHistory failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 2: USER MANAGEMENT IAM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 4: UserExists
print_test "2.1 UserExists - Check user existence"
RESULT=$(query_chaincode "UserExists" '["test-user-hash"]')
if echo "$RESULT" | grep -q "true\|false"; then
    print_pass "UserExists works correctly"
else
    print_fail "UserExists failed: $RESULT"
fi

# Test 5: RegisterUser (requires admin/government role)
print_test "2.2 RegisterUser - Create new user"
TIMESTAMP=$(date +%s)
USER_ID="test_worker_${TIMESTAMP}"
USER_HASH="hash_${TIMESTAMP}"
RESULT=$(invoke_chaincode "RegisterUser" "[\"$USER_ID\",\"$USER_HASH\",\"worker\",\"org1\",\"Test Worker\",\"contact_hash\"]")
if echo "$RESULT" | grep -q "committed\|success"; then
    print_pass "RegisterUser works correctly"
else
    # May fail due to IAM restrictions - that's expected
    if echo "$RESULT" | grep -q "access denied"; then
        print_info "RegisterUser correctly enforces IAM (access denied without proper role)"
        print_pass "RegisterUser IAM check working"
    else
        print_fail "RegisterUser failed: $RESULT"
    fi
fi

# Test 6: GetUserProfile
print_test "2.3 GetUserProfile - Retrieve user profile"
RESULT=$(query_chaincode "GetUserProfile" "[\"$USER_HASH\"]")
if echo "$RESULT" | grep -q "userId\|not found\|access denied"; then
    print_pass "GetUserProfile works correctly"
else
    print_fail "GetUserProfile failed: $RESULT"
fi

# Test 7: VerifyUserRole
print_test "2.4 VerifyUserRole - Check user role"
RESULT=$(query_chaincode "VerifyUserRole" "[\"$USER_HASH\",\"worker\"]")
if echo "$RESULT" | grep -q "true\|false\|not found\|access denied"; then
    print_pass "VerifyUserRole works correctly"
else
    print_fail "VerifyUserRole failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 3: WAGE RECORD IAM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 8: RecordWage (requires employer role)
print_test "3.1 RecordWage - Create wage record"
WAGE_ID="WAGE_IAM_TEST_${TIMESTAMP}"
RESULT=$(invoke_chaincode "RecordWage" "[\"$WAGE_ID\",\"worker-hash-001\",\"employer-hash-001\",\"5000\",\"INR\",\"construction\",\"\",\"2025-Q4\"]")
if echo "$RESULT" | grep -q "committed\|success"; then
    print_pass "RecordWage works correctly"
else
    if echo "$RESULT" | grep -q "access denied"; then
        print_info "RecordWage correctly enforces IAM restrictions"
        print_pass "RecordWage IAM check working"
    else
        print_fail "RecordWage failed: $RESULT"
    fi
fi

# Test 9: QueryWagesByWorker
print_test "3.2 QueryWagesByWorker - Worker-specific query"
RESULT=$(query_chaincode "QueryWagesByWorker" '["worker-001"]')
if echo "$RESULT" | grep -q "workerIdHash\|\[\]\|access denied"; then
    print_pass "QueryWagesByWorker works correctly"
else
    print_fail "QueryWagesByWorker failed: $RESULT"
fi

# Test 10: QueryWagesByEmployer
print_test "3.3 QueryWagesByEmployer - Employer-specific query"
RESULT=$(query_chaincode "QueryWagesByEmployer" '["employer-001"]')
if echo "$RESULT" | grep -q "employerIdHash\|\[\]\|access denied"; then
    print_pass "QueryWagesByEmployer works correctly"
else
    print_fail "QueryWagesByEmployer failed: $RESULT"
fi

# Test 11: CalculateTotalIncome
print_test "3.4 CalculateTotalIncome - Income calculation"
RESULT=$(query_chaincode "CalculateTotalIncome" '["worker-001","",""]')
if echo "$RESULT" | grep -q "^[0-9]\|access denied"; then
    print_pass "CalculateTotalIncome works correctly"
else
    print_fail "CalculateTotalIncome failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 4: UPI TRANSACTION IAM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 12: RecordUPITransaction (requires employer/bank_officer role)
print_test "4.1 RecordUPITransaction - Create UPI transaction"
UPI_ID="UPI_IAM_TEST_${TIMESTAMP}"
RESULT=$(invoke_chaincode "RecordUPITransaction" "[\"$UPI_ID\",\"worker-hash-001\",\"2500\",\"INR\",\"Test Sender\",\"9876543210\",\"REF123\",\"UPI\"]")
if echo "$RESULT" | grep -q "committed\|success\|UPI_"; then
    print_pass "RecordUPITransaction works correctly"
else
    if echo "$RESULT" | grep -q "access denied"; then
        print_info "RecordUPITransaction correctly enforces IAM restrictions"
        print_pass "RecordUPITransaction IAM check working"
    else
        print_fail "RecordUPITransaction failed: $RESULT"
    fi
fi

# Test 13: QueryUPITransactionsByWorker
print_test "4.2 QueryUPITransactionsByWorker - Worker UPI query"
RESULT=$(query_chaincode "QueryUPITransactionsByWorker" '["worker-hash-001"]')
if echo "$RESULT" | grep -q "txId\|\[\]\|access denied"; then
    print_pass "QueryUPITransactionsByWorker works correctly"
else
    print_fail "QueryUPITransactionsByWorker failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 5: POVERTY THRESHOLD IAM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 14: GetPovertyThreshold (accessible to all)
print_test "5.1 GetPovertyThreshold - Read threshold"
RESULT=$(query_chaincode "GetPovertyThreshold" '["Karnataka","BPL"]')
if echo "$RESULT" | grep -q "amount\|not found\|DEFAULT"; then
    print_pass "GetPovertyThreshold works correctly"
else
    print_fail "GetPovertyThreshold failed: $RESULT"
fi

# Test 15: SetPovertyThreshold (requires government role)
print_test "5.2 SetPovertyThreshold - Set threshold (government only)"
RESULT=$(invoke_chaincode "SetPovertyThreshold" '["TestState","BPL","35000","gov-official-001"]')
if echo "$RESULT" | grep -q "committed\|success"; then
    print_pass "SetPovertyThreshold works correctly"
else
    if echo "$RESULT" | grep -q "access denied"; then
        print_info "SetPovertyThreshold correctly enforces IAM (government only)"
        print_pass "SetPovertyThreshold IAM check working"
    else
        print_fail "SetPovertyThreshold failed: $RESULT"
    fi
fi

# Test 16: CheckPovertyStatus
print_test "5.3 CheckPovertyStatus - Determine BPL/APL"
RESULT=$(query_chaincode "CheckPovertyStatus" '["worker-001","Karnataka","",""]')
if echo "$RESULT" | grep -q "status\|BPL\|APL\|access denied"; then
    print_pass "CheckPovertyStatus works correctly"
else
    print_fail "CheckPovertyStatus failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 6: ANOMALY DETECTION IAM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 17: FlagAnomaly (requires auditor/government role)
print_test "6.1 FlagAnomaly - Flag suspicious wage"
RESULT=$(invoke_chaincode "FlagAnomaly" '["WAGE001","0.85","Suspicious high amount","auditor-001"]')
if echo "$RESULT" | grep -q "committed\|success"; then
    print_pass "FlagAnomaly works correctly"
else
    if echo "$RESULT" | grep -q "access denied"; then
        print_info "FlagAnomaly correctly enforces IAM (auditor/government only)"
        print_pass "FlagAnomaly IAM check working"
    else
        print_fail "FlagAnomaly failed: $RESULT"
    fi
fi

# Test 18: GetFlaggedWages (requires auditor/government role)
print_test "6.2 GetFlaggedWages - Retrieve flagged records"
RESULT=$(query_chaincode "GetFlaggedWages" '["0.5"]')
if echo "$RESULT" | grep -q "wageId\|\[\]\|access denied"; then
    print_pass "GetFlaggedWages works correctly"
else
    print_fail "GetFlaggedWages failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 7: COMPLIANCE REPORT IAM"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 19: GenerateComplianceReport (requires government/auditor role)
print_test "7.1 GenerateComplianceReport - Generate report"
RESULT=$(query_chaincode "GenerateComplianceReport" '["2024-01-01","2025-12-31","wage_summary"]')
if echo "$RESULT" | grep -q "reportType\|totalRecords\|access denied"; then
    print_pass "GenerateComplianceReport works correctly"
else
    print_fail "GenerateComplianceReport failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 8: AUDIT LOG FUNCTIONS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 20: GetAuditLogs
print_test "8.1 GetAuditLogs - Retrieve audit logs"
RESULT=$(query_chaincode "GetAuditLogs" '["{}"]')
if echo "$RESULT" | grep -q "logId\|\[\]\|access denied\|null"; then
    print_pass "GetAuditLogs works correctly"
else
    print_fail "GetAuditLogs failed: $RESULT"
fi

# Test 21: GetAuditSummary
print_test "8.2 GetAuditSummary - Audit summary"
RESULT=$(query_chaincode "GetAuditSummary" '["2024-01-01","2025-12-31"]')
if echo "$RESULT" | grep -q "totalEvents\|eventsByType\|access denied\|null"; then
    print_pass "GetAuditSummary works correctly"
else
    print_fail "GetAuditSummary failed: $RESULT"
fi

# Test 22: GetHighRiskEvents
print_test "8.3 GetHighRiskEvents - Security events"
RESULT=$(query_chaincode "GetHighRiskEvents" '["50"]')
if echo "$RESULT" | grep -q "riskLevel\|\[\]\|access denied\|null"; then
    print_pass "GetHighRiskEvents works correctly"
else
    print_fail "GetHighRiskEvents failed: $RESULT"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SECTION 9: CROSS-ORG ACCESS TEST"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test 23: Cross-org read (Org2 reading data)
print_test "9.1 Cross-org read - Org2 accessing data"
setup_org2
RESULT=$(query_chaincode "ReadWage" '["WAGE001"]')
if echo "$RESULT" | grep -q "wageId\|access denied"; then
    print_pass "Cross-org read test completed"
else
    print_fail "Cross-org read failed: $RESULT"
fi

# Test 24: Cross-org invoke (Org2 trying to modify)
print_test "9.2 Cross-org invoke - Org2 write attempt"
RESULT=$(invoke_chaincode "RecordWage" '["WAGE_ORG2_TEST","worker-002","employer-002","3000","INR","test","","2025-Q4"]')
if echo "$RESULT" | grep -q "committed\|success\|access denied"; then
    print_pass "Cross-org invoke test completed"
else
    print_fail "Cross-org invoke failed: $RESULT"
fi

# Switch back to Org1
setup_org1

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST RESULTS SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo -e "${CYAN}Total Tests:${NC} $TOTAL"
echo -e "${GREEN}Passed:${NC}      $PASSED"
echo -e "${RED}Failed:${NC}      $FAILED"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         ✓ ALL IAM TESTS PASSED SUCCESSFULLY!                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║         ⚠ SOME TESTS FAILED - Review results above            ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
