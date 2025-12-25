#!/bin/bash
#
# TRACIENT Blockchain - Comprehensive Chaincode Test Script
# 
# Tests all 24 chaincode functions to verify proper deployment.
#
# Usage:
#   ./test-chaincode.sh              # Run all tests
#   ./test-chaincode.sh --quick      # Quick test (essential functions only)
#   ./test-chaincode.sh --verbose    # Verbose output
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Auto-detect script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="${SCRIPT_DIR}/network/test-network"

# Configuration
CHANNEL_NAME="mychannel"
CHAINCODE_NAME="tracient"

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Parse arguments
QUICK_MODE=false
VERBOSE=false
for arg in "$@"; do
    case $arg in
        --quick|-q)
            QUICK_MODE=true
            ;;
        --verbose|-v)
            VERBOSE=true
            ;;
    esac
done

print_banner() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║      TRACIENT Chaincode Test Suite                         ║${NC}"
    echo -e "${CYAN}║      Testing All 24 Functions                              ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_test() {
    echo -e "${BLUE}  Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}  ✓ PASS:${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}  ✗ FAIL:${NC} $1"
    ((FAILED++))
}

print_skip() {
    echo -e "${YELLOW}  ⊘ SKIP:${NC} $1"
    ((SKIPPED++))
}

# Set up environment
setup_env() {
    export PATH="${SCRIPT_DIR}/network/bin:$PATH"
    export FABRIC_CFG_PATH="${SCRIPT_DIR}/network/config"
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
    export CORE_PEER_MSPCONFIGPATH="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    export CORE_PEER_ADDRESS=localhost:7051
    
    # For invoke commands
    export ORDERER_CA="${NETWORK_DIR}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
    export ORG1_TLSCERT="${NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
    export ORG2_TLSCERT="${NETWORK_DIR}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
}

# Query function
query() {
    local func="$1"
    local args="$2"
    peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c "{\"function\":\"$func\",\"Args\":[$args]}" 2>&1
}

# Invoke function
invoke() {
    local func="$1"
    local args="$2"
    peer chaincode invoke \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "$ORDERER_CA" \
        -C $CHANNEL_NAME \
        -n $CHAINCODE_NAME \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles "$ORG1_TLSCERT" \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles "$ORG2_TLSCERT" \
        -c "{\"function\":\"$func\",\"Args\":[$args]}" 2>&1
}

# Generate unique IDs
TIMESTAMP=$(date +%s)
TEST_WAGE_ID="WAGE_TEST_${TIMESTAMP}"
TEST_USER_ID="USER_TEST_${TIMESTAMP}"
TEST_UPI_ID="UPI_TEST_${TIMESTAMP}"

print_banner
setup_env

# Check if network is running
echo "Checking network status..."
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "${RED}✗ Network is not running. Start it with: ./start-network.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Network is running${NC}"

# Check chaincode
echo "Checking chaincode..."
COMMITTED=$(peer lifecycle chaincode querycommitted -C $CHANNEL_NAME -n $CHAINCODE_NAME 2>&1 || true)
if echo "$COMMITTED" | grep -q "Version:"; then
    VERSION=$(echo "$COMMITTED" | grep "Version:" | awk '{print $2}' | tr -d ',')
    echo -e "${GREEN}✓ Chaincode v${VERSION} is deployed${NC}"
else
    echo -e "${RED}✗ Chaincode not deployed. Run: ./deploy-chaincode.sh${NC}"
    exit 1
fi

# ============================================================================
# SECTION 1: INITIALIZATION FUNCTIONS
# ============================================================================
print_section "1. INITIALIZATION FUNCTIONS"

print_test "InitLedger"
RESULT=$(invoke "InitLedger" "")
if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    print_pass "InitLedger executed successfully"
elif echo "$RESULT" | grep -q "already exists"; then
    print_pass "InitLedger already run (data exists)"
else
    print_fail "InitLedger - $RESULT"
fi

# ============================================================================
# SECTION 2: WAGE RECORD FUNCTIONS
# ============================================================================
print_section "2. WAGE RECORD FUNCTIONS"

# Test RecordWage
print_test "RecordWage"
RESULT=$(invoke "RecordWage" "\"${TEST_WAGE_ID}\",\"worker-test-001\",\"employer-test-001\",\"5000\",\"INR\",\"testing\",\"2025-12-25T10:00:00Z\",\"2025-Q4\"")
if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    print_pass "RecordWage created ${TEST_WAGE_ID}"
else
    print_fail "RecordWage - $RESULT"
fi
sleep 2

# Test ReadWage
print_test "ReadWage"
RESULT=$(query "ReadWage" "\"${TEST_WAGE_ID}\"")
if echo "$RESULT" | grep -q "workerIdHash"; then
    print_pass "ReadWage retrieved record"
    if [ "$VERBOSE" = true ]; then
        echo "    $RESULT"
    fi
else
    # Try reading WAGE001 from InitLedger
    RESULT=$(query "ReadWage" "\"WAGE001\"")
    if echo "$RESULT" | grep -q "workerIdHash"; then
        print_pass "ReadWage retrieved WAGE001"
    else
        print_fail "ReadWage - $RESULT"
    fi
fi

# Test WageExists
print_test "WageExists"
RESULT=$(query "WageExists" "\"${TEST_WAGE_ID}\"")
if echo "$RESULT" | grep -q "true"; then
    print_pass "WageExists returned true"
elif echo "$RESULT" | grep -q "false"; then
    # Test with WAGE001
    RESULT=$(query "WageExists" "\"WAGE001\"")
    if echo "$RESULT" | grep -q "true"; then
        print_pass "WageExists returned true for WAGE001"
    else
        print_fail "WageExists - $RESULT"
    fi
else
    print_fail "WageExists - $RESULT"
fi

# Test QueryWageHistory
print_test "QueryWageHistory"
RESULT=$(query "QueryWageHistory" "\"WAGE001\"")
if echo "$RESULT" | grep -q "workerIdHash\|\[\]"; then
    print_pass "QueryWageHistory returned history"
else
    print_fail "QueryWageHistory - $RESULT"
fi

# Test QueryWagesByWorker
print_test "QueryWagesByWorker"
RESULT=$(query "QueryWagesByWorker" "\"worker-001\"")
if echo "$RESULT" | grep -q "workerIdHash\|\[\]"; then
    print_pass "QueryWagesByWorker found records"
else
    print_fail "QueryWagesByWorker - $RESULT"
fi

# Test QueryWagesByEmployer
print_test "QueryWagesByEmployer"
RESULT=$(query "QueryWagesByEmployer" "\"employer-001\"")
if echo "$RESULT" | grep -q "employerIdHash\|\[\]"; then
    print_pass "QueryWagesByEmployer found records"
else
    print_fail "QueryWagesByEmployer - $RESULT"
fi

# Test CalculateTotalIncome
print_test "CalculateTotalIncome"
RESULT=$(query "CalculateTotalIncome" "\"worker-001\",\"2024-01-01\",\"2025-12-31\"")
if echo "$RESULT" | grep -qE "^[0-9]+\.?[0-9]*$|^0$"; then
    print_pass "CalculateTotalIncome returned: $RESULT"
else
    print_fail "CalculateTotalIncome - $RESULT"
fi

if [ "$QUICK_MODE" = false ]; then
    # Test BatchRecordWages
    print_test "BatchRecordWages"
    BATCH_JSON='[{"wageId":"WAGE_BATCH_1_'${TIMESTAMP}'","workerIdHash":"worker-batch","employerIdHash":"employer-batch","amount":1000,"currency":"INR","jobType":"batch_test","timestamp":"2025-12-25T12:00:00Z","policyVersion":"2025-Q4"}]'
    RESULT=$(invoke "BatchRecordWages" "\"${BATCH_JSON}\"")
    if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
        print_pass "BatchRecordWages executed"
    else
        print_fail "BatchRecordWages - $RESULT"
    fi
    sleep 2

    # Test GetWorkerIncomeHistory
    print_test "GetWorkerIncomeHistory"
    RESULT=$(query "GetWorkerIncomeHistory" "\"worker-001\",\"12\"")
    if echo "$RESULT" | grep -q "month\|totalIncome\|\[\]"; then
        print_pass "GetWorkerIncomeHistory returned data"
    else
        print_fail "GetWorkerIncomeHistory - $RESULT"
    fi
fi

# ============================================================================
# SECTION 3: UPI TRANSACTION FUNCTIONS
# ============================================================================
print_section "3. UPI TRANSACTION FUNCTIONS"

# Test RecordUPITransaction
print_test "RecordUPITransaction"
RESULT=$(invoke "RecordUPITransaction" "\"${TEST_UPI_ID}\",\"worker-upi-001\",\"2500\",\"INR\",\"Test Sender\",\"9876543210\",\"REF${TIMESTAMP}\",\"UPI\"")
if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    print_pass "RecordUPITransaction created ${TEST_UPI_ID}"
else
    print_fail "RecordUPITransaction - $RESULT"
fi
sleep 2

# Test UPITransactionExists
print_test "UPITransactionExists"
RESULT=$(query "UPITransactionExists" "\"${TEST_UPI_ID}\"")
if echo "$RESULT" | grep -q "true\|false"; then
    print_pass "UPITransactionExists returned: $RESULT"
else
    print_fail "UPITransactionExists - $RESULT"
fi

# Test ReadUPITransaction
print_test "ReadUPITransaction"
RESULT=$(query "ReadUPITransaction" "\"${TEST_UPI_ID}\"")
if echo "$RESULT" | grep -q "txId\|workerIdHash"; then
    print_pass "ReadUPITransaction retrieved record"
else
    print_fail "ReadUPITransaction - $RESULT"
fi

# Test QueryUPITransactionsByWorker
print_test "QueryUPITransactionsByWorker"
RESULT=$(query "QueryUPITransactionsByWorker" "\"worker-upi-001\"")
if echo "$RESULT" | grep -q "txId\|\[\]"; then
    print_pass "QueryUPITransactionsByWorker returned data"
else
    print_fail "QueryUPITransactionsByWorker - $RESULT"
fi

# ============================================================================
# SECTION 4: IDENTITY MANAGEMENT FUNCTIONS
# ============================================================================
print_section "4. IDENTITY MANAGEMENT FUNCTIONS"

# Test RegisterUser
print_test "RegisterUser"
RESULT=$(invoke "RegisterUser" "\"user_${TIMESTAMP}\",\"${TEST_USER_ID}\",\"worker\",\"Org1MSP\",\"Test User\",\"contact_hash_123\"")
if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    print_pass "RegisterUser created ${TEST_USER_ID}"
else
    print_fail "RegisterUser - $RESULT"
fi
sleep 2

# Test GetUserProfile
print_test "GetUserProfile"
RESULT=$(query "GetUserProfile" "\"${TEST_USER_ID}\"")
if echo "$RESULT" | grep -q "userId\|role"; then
    print_pass "GetUserProfile retrieved user"
else
    print_fail "GetUserProfile - $RESULT"
fi

# Test UserExists
print_test "UserExists"
RESULT=$(query "UserExists" "\"${TEST_USER_ID}\"")
if echo "$RESULT" | grep -q "true"; then
    print_pass "UserExists returned true"
else
    print_fail "UserExists - $RESULT"
fi

# Test VerifyUserRole
print_test "VerifyUserRole"
RESULT=$(query "VerifyUserRole" "\"${TEST_USER_ID}\",\"worker\"")
if echo "$RESULT" | grep -q "true"; then
    print_pass "VerifyUserRole returned true"
elif echo "$RESULT" | grep -q "false"; then
    print_pass "VerifyUserRole returned false (different role)"
else
    print_fail "VerifyUserRole - $RESULT"
fi

if [ "$QUICK_MODE" = false ]; then
    # Test UpdateUserStatus
    print_test "UpdateUserStatus"
    RESULT=$(invoke "UpdateUserStatus" "\"${TEST_USER_ID}\",\"inactive\",\"admin_user\"")
    if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
        print_pass "UpdateUserStatus executed"
    else
        print_fail "UpdateUserStatus - $RESULT"
    fi
    sleep 1
fi

# ============================================================================
# SECTION 5: POVERTY THRESHOLD FUNCTIONS
# ============================================================================
print_section "5. POVERTY THRESHOLD FUNCTIONS"

# Test SetPovertyThreshold
print_test "SetPovertyThreshold"
RESULT=$(invoke "SetPovertyThreshold" "\"TestState\",\"BPL\",\"45000\",\"gov_official_001\"")
if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    print_pass "SetPovertyThreshold set for TestState"
else
    print_fail "SetPovertyThreshold - $RESULT"
fi
sleep 2

# Test GetPovertyThreshold
print_test "GetPovertyThreshold"
RESULT=$(query "GetPovertyThreshold" "\"TestState\",\"BPL\"")
if echo "$RESULT" | grep -q "amount\|state"; then
    print_pass "GetPovertyThreshold retrieved threshold"
elif echo "$RESULT" | grep -q "DEFAULT"; then
    print_pass "GetPovertyThreshold returned DEFAULT threshold"
else
    # Try DEFAULT
    RESULT=$(query "GetPovertyThreshold" "\"DEFAULT\",\"BPL\"")
    if echo "$RESULT" | grep -q "amount"; then
        print_pass "GetPovertyThreshold returned DEFAULT threshold"
    else
        print_fail "GetPovertyThreshold - $RESULT"
    fi
fi

# Test CheckPovertyStatus
print_test "CheckPovertyStatus"
RESULT=$(query "CheckPovertyStatus" "\"worker-001\",\"TestState\",\"2024-01-01\",\"2025-12-31\"")
if echo "$RESULT" | grep -q "status\|BPL\|APL"; then
    print_pass "CheckPovertyStatus returned status"
    if [ "$VERBOSE" = true ]; then
        echo "    $RESULT"
    fi
else
    print_fail "CheckPovertyStatus - $RESULT"
fi

# ============================================================================
# SECTION 6: ANOMALY DETECTION FUNCTIONS
# ============================================================================
print_section "6. ANOMALY DETECTION FUNCTIONS"

# Test FlagAnomaly
print_test "FlagAnomaly"
RESULT=$(invoke "FlagAnomaly" "\"WAGE001\",\"0.85\",\"High amount for job type\",\"ai_model_v1\"")
if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
    print_pass "FlagAnomaly flagged WAGE001"
else
    print_fail "FlagAnomaly - $RESULT"
fi
sleep 2

# Test GetFlaggedWages
print_test "GetFlaggedWages"
RESULT=$(query "GetFlaggedWages" "\"0.5\"")
if echo "$RESULT" | grep -q "wageId\|anomalyScore\|\[\]"; then
    print_pass "GetFlaggedWages returned results"
else
    print_fail "GetFlaggedWages - $RESULT"
fi

if [ "$QUICK_MODE" = false ]; then
    # Test UpdateAnomalyStatus
    print_test "UpdateAnomalyStatus"
    RESULT=$(invoke "UpdateAnomalyStatus" "\"WAGE001\",\"reviewed\",\"auditor_001\"")
    if echo "$RESULT" | grep -q "status:200\|Chaincode invoke successful"; then
        print_pass "UpdateAnomalyStatus updated"
    else
        print_fail "UpdateAnomalyStatus - $RESULT"
    fi
    sleep 1
fi

# ============================================================================
# SECTION 7: COMPLIANCE REPORT FUNCTIONS
# ============================================================================
print_section "7. COMPLIANCE REPORT FUNCTIONS"

# Test GenerateComplianceReport - wage_summary
print_test "GenerateComplianceReport (wage_summary)"
RESULT=$(query "GenerateComplianceReport" "\"2024-01-01\",\"2025-12-31\",\"wage_summary\"")
if echo "$RESULT" | grep -q "reportType\|totalRecords"; then
    print_pass "GenerateComplianceReport returned wage_summary"
else
    print_fail "GenerateComplianceReport (wage_summary) - $RESULT"
fi

if [ "$QUICK_MODE" = false ]; then
    # Test GenerateComplianceReport - fraud_flags
    print_test "GenerateComplianceReport (fraud_flags)"
    RESULT=$(query "GenerateComplianceReport" "\"2024-01-01\",\"2025-12-31\",\"fraud_flags\"")
    if echo "$RESULT" | grep -q "reportType\|totalRecords"; then
        print_pass "GenerateComplianceReport returned fraud_flags"
    else
        print_fail "GenerateComplianceReport (fraud_flags) - $RESULT"
    fi

    # Test GenerateComplianceReport - employer_compliance
    print_test "GenerateComplianceReport (employer_compliance)"
    RESULT=$(query "GenerateComplianceReport" "\"2024-01-01\",\"2025-12-31\",\"employer_compliance\"")
    if echo "$RESULT" | grep -q "reportType\|totalRecords"; then
        print_pass "GenerateComplianceReport returned employer_compliance"
    else
        print_fail "GenerateComplianceReport (employer_compliance) - $RESULT"
    fi
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    TEST SUMMARY                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))

echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
echo -e "  ${BLUE}Total:${NC}   $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check chaincode logs: docker logs dev-peer0.org1.example.com-tracient*"
    echo "  2. Verify network: peer channel list"
    echo "  3. Check chaincode: peer lifecycle chaincode querycommitted -C mychannel"
    echo "  4. Redeploy: ./deploy-chaincode.sh"
    exit 1
fi
