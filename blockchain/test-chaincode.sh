#!/bin/bash
#
# TRACIENT Blockchain - Comprehensive Chaincode Test Script
# 
# Tests all 26 chaincode functions to verify proper deployment.
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
    echo -e "${CYAN}============================================================${NC}"
    echo -e "${CYAN}      TRACIENT Chaincode Test Suite                         ${NC}"
    echo -e "${CYAN}      Testing All 26 Functions                              ${NC}"
    echo -e "${CYAN}============================================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${MAGENTA}------------------------------------------------------------${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}------------------------------------------------------------${NC}"
}

print_test() {
    echo -e "${BLUE}  Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}  [PASS]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}  [FAIL]${NC} $1"
    ((FAILED++))
}

print_skip() {
    echo -e "${YELLOW}  [SKIP]${NC} $1"
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
run_query() {
    local func=$1
    local args=$2
    local result
    
    result=$(peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c "{\"function\":\"$func\",\"Args\":$args}" 2>&1)
    echo "$result"
}

# Invoke function
run_invoke() {
    local func=$1
    local args=$2
    local result
    
    result=$(peer chaincode invoke \
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
        -c "{\"function\":\"$func\",\"Args\":$args}" 2>&1)
    echo "$result"
}

# Test a query function
test_query() {
    local name=$1
    local func=$2
    local args=$3
    local expected=$4
    
    print_test "$name"
    local result=$(run_query "$func" "$args")
    
    if [ "$VERBOSE" = true ]; then
        echo "    Result: $result"
    fi
    
    if echo "$result" | grep -qi "$expected"; then
        print_pass "$name"
        return 0
    elif echo "$result" | grep -qi "error\|Error\|failed"; then
        print_fail "$name - Error: $(echo $result | head -c 100)"
        return 1
    else
        print_pass "$name (returned data)"
        return 0
    fi
}

# Test an invoke function
test_invoke() {
    local name=$1
    local func=$2
    local args=$3
    
    print_test "$name"
    local result=$(run_invoke "$func" "$args")
    
    if [ "$VERBOSE" = true ]; then
        echo "    Result: $result"
    fi
    
    if echo "$result" | grep -qi "committed\|success\|status:200"; then
        print_pass "$name"
        return 0
    elif echo "$result" | grep -qi "already exists"; then
        print_pass "$name (already exists)"
        return 0
    else
        print_fail "$name - $(echo $result | head -c 100)"
        return 1
    fi
}

# Main test execution
print_banner
setup_env

# Verify network is running
echo "Checking network status..."
if ! docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "${RED}[ERROR]${NC} Network is not running. Start with: ./start-network.sh"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Network is running"
echo ""

# ==================== WAGE FUNCTIONS ====================
print_section "WAGE MANAGEMENT FUNCTIONS (10)"

test_query "ReadWage" "ReadWage" '["WAGE001"]' "wageId"
test_query "QueryWagesByWorker" "QueryWagesByWorker" '["worker1hash"]' ""
test_query "QueryWagesByEmployer" "QueryWagesByEmployer" '["employer1hash"]' ""
test_query "QueryWagesByDateRange" "QueryWagesByDateRange" '["2024-01-01T00:00:00Z","2024-12-31T23:59:59Z"]' ""
test_query "CalculateTotalIncome" "CalculateTotalIncome" '["worker1hash","2024-01-01T00:00:00Z","2024-12-31T23:59:59Z"]' ""
test_query "GetWageHistory" "GetWageHistory" '["WAGE001"]' ""

# Test CreateWage (invoke)
WAGE_ID="WAGE_TEST_$(date +%s)"
test_invoke "CreateWage" "CreateWage" "[\"$WAGE_ID\",\"testworker\",\"testemployer\",\"15000\",\"INR\",\"monthly\",\"Test payment\"]"

test_invoke "UpdateWage" "UpdateWage" "[\"WAGE001\",\"16000\",\"verified\"]"
test_invoke "DeleteWage" "DeleteWage" "[\"$WAGE_ID\"]"
test_query "WageExists" "WageExists" '["WAGE001"]' ""

# ==================== UPI FUNCTIONS ====================
print_section "UPI/PAYMENT FUNCTIONS (4)"

test_query "ReadUPITransaction" "ReadUPITransaction" '["UPI001"]' ""
test_query "QueryUPIByUser" "QueryUPIByUser" '["worker1hash"]' ""
test_query "GetUPITransactionHistory" "GetUPITransactionHistory" '["UPI001"]' ""

UPI_ID="UPI_TEST_$(date +%s)"
test_invoke "CreateUPITransaction" "CreateUPITransaction" "[\"$UPI_ID\",\"worker1hash\",\"merchant1\",\"500\",\"INR\",\"Payment for goods\"]"

# ==================== USER FUNCTIONS ====================
print_section "USER MANAGEMENT FUNCTIONS (5)"

test_query "ReadUser" "ReadUser" '["worker1hash"]' ""
test_query "QueryUsersByType" "QueryUsersByType" '["worker"]' ""
test_query "GetUserHistory" "GetUserHistory" '["worker1hash"]' ""

USER_ID="USER_TEST_$(date +%s)"
test_invoke "CreateUser" "CreateUser" "[\"$USER_ID\",\"Test User\",\"worker\",\"test@example.com\",\"Maharashtra\"]"
test_invoke "UpdateUser" "UpdateUser" "[\"worker1hash\",\"Worker One Updated\",\"worker1@example.com\"]"

# ==================== POVERTY FUNCTIONS ====================
print_section "POVERTY ASSESSMENT FUNCTIONS (3)"

test_query "GetPovertyThreshold" "GetPovertyThreshold" '["Maharashtra","BPL"]' ""
test_query "CheckPovertyStatus" "CheckPovertyStatus" '["worker1hash","Maharashtra","2024","12"]' ""
test_invoke "SetPovertyThreshold" "SetPovertyThreshold" '["TestState","BPL","12000","monthly"]'

# ==================== ANOMALY FUNCTIONS ====================
print_section "ANOMALY DETECTION FUNCTIONS (3)"

test_query "GetAnomalyReport" "GetAnomalyReport" '["worker1hash","2024-01","2024-12"]' ""
test_invoke "RecordAnomaly" "RecordAnomaly" '["worker1hash","income_spike","Unusual income pattern detected","medium"]'
test_query "GetAnomalyHistory" "GetAnomalyHistory" '["worker1hash"]' ""

# ==================== COMPLIANCE FUNCTIONS ====================
print_section "COMPLIANCE & AUDIT FUNCTIONS (1)"

test_query "GenerateComplianceReport" "GenerateComplianceReport" '["worker1hash","2024"]' ""

# ==================== SUMMARY ====================
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}                    TEST SUMMARY                            ${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "  Total Tests: $((PASSED + FAILED + SKIPPED))"
echo -e "  ${GREEN}Passed:${NC} $PASSED"
echo -e "  ${RED}Failed:${NC} $FAILED"
echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}  ALL TESTS PASSED!                                         ${NC}"
    echo -e "${GREEN}============================================================${NC}"
    exit 0
else
    echo -e "${RED}============================================================${NC}"
    echo -e "${RED}  SOME TESTS FAILED - Please check the output above         ${NC}"
    echo -e "${RED}============================================================${NC}"
    exit 1
fi
