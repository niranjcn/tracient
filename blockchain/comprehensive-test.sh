#!/bin/bash
#
# COMPREHENSIVE BLOCKCHAIN TEST SCRIPT
# Tests all chaincode functions with IAM for Tracient Project
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a TEST_RESULTS

# Navigate to test-network
cd /mnt/e/Major-Project/fabric-samples/test-network || {
    echo -e "${RED}Failed to navigate to test-network${NC}"
    exit 1
}

# Set environment for Org1
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Function to run a test and capture result
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-success}"  # default: expect success
    local test_category="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${CYAN}[TEST ${TOTAL_TESTS}] ${test_name}${NC}"
    echo -e "${BLUE}Command: ${test_command:0:100}...${NC}"
    
    set +e
    output=$(eval "$test_command" 2>&1)
    result=$?
    set -e
    
    # Check if test passed
    if [[ "$expected_result" == "success" ]]; then
        if [[ $result -eq 0 && ! "$output" =~ "access denied" && ! "$output" =~ "Error" ]]; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo -e "${GREEN}✓ PASSED${NC}"
            TEST_RESULTS+=("PASS|${test_category}|${test_name}|${output:0:200}")
            return 0
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            echo -e "${RED}✗ FAILED${NC}"
            echo -e "${YELLOW}Output: ${output:0:300}${NC}"
            TEST_RESULTS+=("FAIL|${test_category}|${test_name}|${output:0:200}")
            return 1
        fi
    else
        # Expected to fail (e.g., access denied test)
        if [[ "$output" =~ "access denied" || "$output" =~ "ACCESS DENIED" || $result -ne 0 ]]; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo -e "${GREEN}✓ PASSED (Expected denial)${NC}"
            TEST_RESULTS+=("PASS|${test_category}|${test_name}|Expected denial occurred")
            return 0
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            echo -e "${RED}✗ FAILED (Should have been denied)${NC}"
            TEST_RESULTS+=("FAIL|${test_category}|${test_name}|Should have been denied")
            return 1
        fi
    fi
}

# Print header
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}    TRACIENT BLOCKCHAIN COMPREHENSIVE TEST SUITE${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "${YELLOW}Date: $(date)${NC}"
echo -e "${YELLOW}Network: Hyperledger Fabric Test Network${NC}"
echo -e "${YELLOW}Chaincode: tracient${NC}"
echo -e "${YELLOW}Channel: mychannel${NC}"
echo -e "${BLUE}============================================================${NC}"

# Verify chaincode is deployed
echo -e "\n${YELLOW}[SETUP] Verifying chaincode deployment...${NC}"
COMMITTED=$(peer lifecycle chaincode querycommitted --channelID mychannel --name tracient --output json 2>&1 || echo "")
if [[ "$COMMITTED" =~ "version" ]]; then
    VERSION=$(echo "$COMMITTED" | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    SEQUENCE=$(echo "$COMMITTED" | grep -o '"sequence":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ Chaincode deployed: version=${VERSION}, sequence=${SEQUENCE}${NC}"
else
    echo -e "${RED}✗ Chaincode not deployed or error querying${NC}"
    exit 1
fi

# ==============================================================================
# SECTION 1: INITIALIZATION TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 1: LEDGER INITIALIZATION${NC}"
echo -e "${BLUE}============================================================${NC}"

run_test "InitLedger - Initialize ledger with seed data" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"InitLedger\",\"Args\":[]}'" \
    "success" \
    "Initialization"

# ==============================================================================
# SECTION 2: WAGE RECORD TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 2: WAGE RECORD FUNCTIONS${NC}"
echo -e "${BLUE}============================================================${NC}"

WAGE_ID="WAGE_TEST_$(date +%s)"

run_test "RecordWage - Record a new wage transaction" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}\",\"worker-hash-001\",\"employer-hash-001\",\"15000.50\",\"INR\",\"construction\",\"\",\"2025-Q4\"]}'" \
    "success" \
    "Wage"

sleep 2

run_test "ReadWage - Read recorded wage" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}\"]}'" \
    "success" \
    "Wage"

run_test "ReadWage - Read seed wage WAGE001" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"WAGE001\"]}'" \
    "success" \
    "Wage"

run_test "QueryWagesByWorker - Query wages by worker hash" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"QueryWagesByWorker\",\"Args\":[\"worker-hash-001\"]}'" \
    "success" \
    "Wage"

run_test "QueryWagesByEmployer - Query wages by employer hash" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"employer-hash-001\"]}'" \
    "success" \
    "Wage"

run_test "QueryWageHistory - Query history for wage record" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}\"]}'" \
    "success" \
    "Wage"

run_test "CalculateTotalIncome - Calculate worker income" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"CalculateTotalIncome\",\"Args\":[\"worker-hash-001\",\"\",\"\"]}'" \
    "success" \
    "Wage"

run_test "GetWorkerIncomeHistory - Get monthly income breakdown" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"worker-hash-001\",\"12\"]}'" \
    "success" \
    "Wage"

# Batch wage record test
BATCH_WAGES='[{"wageId":"WAGE_BATCH_1","workerIdHash":"worker-batch-1","employerIdHash":"employer-batch-1","amount":5000,"currency":"INR","jobType":"retail","timestamp":"","policyVersion":"2025-Q4"},{"wageId":"WAGE_BATCH_2","workerIdHash":"worker-batch-2","employerIdHash":"employer-batch-1","amount":7500,"currency":"INR","jobType":"retail","timestamp":"","policyVersion":"2025-Q4"}]'

run_test "BatchRecordWages - Record multiple wages at once" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"BatchRecordWages\",\"Args\":[\"${BATCH_WAGES}\"]}'" \
    "success" \
    "Wage"

# ==============================================================================
# SECTION 3: UPI TRANSACTION TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 3: UPI TRANSACTION FUNCTIONS${NC}"
echo -e "${BLUE}============================================================${NC}"

UPI_ID="UPI_TEST_$(date +%s)"

run_test "RecordUPITransaction - Record UPI payment" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}\",\"worker-upi-001\",\"2500.00\",\"INR\",\"Test Employer\",\"9876543210\",\"UPI123456\",\"UPI\"]}'" \
    "success" \
    "UPI"

sleep 2

run_test "ReadUPITransaction - Read UPI transaction" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}\"]}'" \
    "success" \
    "UPI"

run_test "QueryUPITransactionsByWorker - Query UPI transactions by worker" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"worker-upi-001\"]}'" \
    "success" \
    "UPI"

# ==============================================================================
# SECTION 4: USER MANAGEMENT TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 4: USER MANAGEMENT FUNCTIONS${NC}"
echo -e "${BLUE}============================================================${NC}"

USER_HASH="user-test-$(date +%s)"

run_test "RegisterUser - Register new worker" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RegisterUser\",\"Args\":[\"USER001\",\"${USER_HASH}\",\"worker\",\"Org1\",\"Test Worker\",\"contact-hash-001\"]}'" \
    "success" \
    "User"

sleep 2

run_test "GetUserProfile - Get user profile" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetUserProfile\",\"Args\":[\"${USER_HASH}\"]}'" \
    "success" \
    "User"

run_test "VerifyUserRole - Verify user has worker role" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"VerifyUserRole\",\"Args\":[\"${USER_HASH}\",\"worker\"]}'" \
    "success" \
    "User"

run_test "UpdateUserStatus - Update user status to inactive" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"UpdateUserStatus\",\"Args\":[\"${USER_HASH}\",\"inactive\",\"admin\"]}'" \
    "success" \
    "User"

# Register different role users
run_test "RegisterUser - Register employer" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RegisterUser\",\"Args\":[\"EMP001\",\"employer-test-hash\",\"employer\",\"Org1\",\"Test Employer\",\"\"]}'" \
    "success" \
    "User"

run_test "RegisterUser - Register government official" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RegisterUser\",\"Args\":[\"GOV001\",\"govt-test-hash\",\"government_official\",\"Org1\",\"Test Official\",\"\"]}'" \
    "success" \
    "User"

run_test "RegisterUser - Register auditor" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RegisterUser\",\"Args\":[\"AUD001\",\"auditor-test-hash\",\"auditor\",\"Org1\",\"Test Auditor\",\"\"]}'" \
    "success" \
    "User"

run_test "RegisterUser - Register bank officer" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RegisterUser\",\"Args\":[\"BANK001\",\"banker-test-hash\",\"bank_officer\",\"Org1\",\"Test Bank Officer\",\"\"]}'" \
    "success" \
    "User"

# ==============================================================================
# SECTION 5: POVERTY THRESHOLD TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 5: POVERTY THRESHOLD FUNCTIONS${NC}"
echo -e "${BLUE}============================================================${NC}"

run_test "GetPovertyThreshold - Get default BPL threshold" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetPovertyThreshold\",\"Args\":[\"DEFAULT\",\"BPL\"]}'" \
    "success" \
    "Threshold"

run_test "GetPovertyThreshold - Get default APL threshold" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetPovertyThreshold\",\"Args\":[\"DEFAULT\",\"APL\"]}'" \
    "success" \
    "Threshold"

run_test "SetPovertyThreshold - Set BPL threshold for Maharashtra" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"SetPovertyThreshold\",\"Args\":[\"MAHARASHTRA\",\"BPL\",\"35000\",\"admin\"]}'" \
    "success" \
    "Threshold"

sleep 2

run_test "GetPovertyThreshold - Get Maharashtra BPL threshold" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetPovertyThreshold\",\"Args\":[\"MAHARASHTRA\",\"BPL\"]}'" \
    "success" \
    "Threshold"

run_test "CheckPovertyStatus - Check poverty status for worker" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"CheckPovertyStatus\",\"Args\":[\"worker-hash-001\",\"DEFAULT\",\"\",\"\"]}'" \
    "success" \
    "Threshold"

# ==============================================================================
# SECTION 6: ANOMALY DETECTION TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 6: ANOMALY DETECTION FUNCTIONS${NC}"
echo -e "${BLUE}============================================================${NC}"

run_test "FlagAnomaly - Flag wage as suspicious" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"FlagAnomaly\",\"Args\":[\"WAGE001\",\"0.85\",\"Unusually high amount for job type\",\"AI-Model\"]}'" \
    "success" \
    "Anomaly"

sleep 2

run_test "GetFlaggedWages - Get all flagged wages" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}'" \
    "success" \
    "Anomaly"

run_test "UpdateAnomalyStatus - Mark anomaly as reviewed" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"WAGE001\",\"reviewed\",\"auditor\"]}'" \
    "success" \
    "Anomaly"

# ==============================================================================
# SECTION 7: COMPLIANCE REPORT TESTS
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 7: COMPLIANCE & REPORTING FUNCTIONS${NC}"
echo -e "${BLUE}============================================================${NC}"

run_test "GenerateComplianceReport - Wage Summary Report" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GenerateComplianceReport\",\"Args\":[\"\",\"\",\"wage_summary\"]}'" \
    "success" \
    "Report"

run_test "GenerateComplianceReport - Fraud Flags Report" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GenerateComplianceReport\",\"Args\":[\"\",\"\",\"fraud_flags\"]}'" \
    "success" \
    "Report"

run_test "GenerateComplianceReport - Employer Compliance Report" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GenerateComplianceReport\",\"Args\":[\"\",\"\",\"employer_compliance\"]}'" \
    "success" \
    "Report"

# ==============================================================================
# SECTION 8: ORG2 IDENTITY TESTS (Cross-Org Access)
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    SECTION 8: CROSS-ORGANIZATION ACCESS (Org2)${NC}"
echo -e "${BLUE}============================================================${NC}"

# Switch to Org2
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051

run_test "Org2 - ReadWage - Cross-org read access" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"ReadWage\",\"Args\":[\"WAGE001\"]}'" \
    "success" \
    "CrossOrg"

run_test "Org2 - GetPovertyThreshold - Cross-org threshold read" \
    "peer chaincode query -C mychannel -n tracient -c '{\"function\":\"GetPovertyThreshold\",\"Args\":[\"DEFAULT\",\"BPL\"]}'" \
    "success" \
    "CrossOrg"

ORG2_WAGE_ID="WAGE_ORG2_$(date +%s)"
run_test "Org2 - RecordWage - Cross-org wage recording" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RecordWage\",\"Args\":[\"${ORG2_WAGE_ID}\",\"worker-org2\",\"employer-org2\",\"8500.00\",\"INR\",\"agriculture\",\"\",\"2025-Q4\"]}'" \
    "success" \
    "CrossOrg"

# Org2 should NOT be able to register users (restricted to Org1)
run_test "Org2 - RegisterUser - Should be DENIED (Org1 only)" \
    "peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile \"\${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem\" -C mychannel -n tracient --peerAddresses localhost:7051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt\" --peerAddresses localhost:9051 --tlsRootCertFiles \"\${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt\" -c '{\"function\":\"RegisterUser\",\"Args\":[\"BLOCKED\",\"blocked-hash\",\"worker\",\"Org2\",\"Blocked User\",\"\"]}'" \
    "deny" \
    "CrossOrg"

# ==============================================================================
# GENERATE FINAL REPORT
# ==============================================================================
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${BLUE}    COMPREHENSIVE TEST REPORT${NC}"
echo -e "${BLUE}============================================================${NC}"

# Summary statistics
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"

PASS_RATE=$(echo "scale=2; ${PASSED_TESTS}*100/${TOTAL_TESTS}" | bc)
echo -e "Pass Rate:    ${PASS_RATE}%"

# Category breakdown
echo -e "\n${YELLOW}=== RESULTS BY CATEGORY ===${NC}"
declare -A CATEGORY_PASS
declare -A CATEGORY_FAIL

for result in "${TEST_RESULTS[@]}"; do
    IFS='|' read -r status category name output <<< "$result"
    if [[ "$status" == "PASS" ]]; then
        CATEGORY_PASS[$category]=$((${CATEGORY_PASS[$category]:-0} + 1))
    else
        CATEGORY_FAIL[$category]=$((${CATEGORY_FAIL[$category]:-0} + 1))
    fi
done

# Print category summary
printf "%-20s %-10s %-10s\n" "CATEGORY" "PASSED" "FAILED"
printf "%-20s %-10s %-10s\n" "--------" "------" "------"
for category in "${!CATEGORY_PASS[@]}" "${!CATEGORY_FAIL[@]}"; do
    pass=${CATEGORY_PASS[$category]:-0}
    fail=${CATEGORY_FAIL[$category]:-0}
    printf "%-20s %-10s %-10s\n" "$category" "$pass" "$fail"
done | sort -u

# Detailed results
echo -e "\n${YELLOW}=== DETAILED TEST RESULTS ===${NC}"
printf "%-8s %-15s %-50s\n" "STATUS" "CATEGORY" "TEST NAME"
printf "%-8s %-15s %-50s\n" "------" "--------" "---------"
for result in "${TEST_RESULTS[@]}"; do
    IFS='|' read -r status category name output <<< "$result"
    if [[ "$status" == "PASS" ]]; then
        printf "${GREEN}%-8s${NC} %-15s %-50s\n" "$status" "$category" "${name:0:50}"
    else
        printf "${RED}%-8s${NC} %-15s %-50s\n" "$status" "$category" "${name:0:50}"
    fi
done

# Final status
echo -e "\n${BLUE}============================================================${NC}"
if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}    ALL TESTS PASSED SUCCESSFULLY!${NC}"
else
    echo -e "${RED}    SOME TESTS FAILED - SEE ABOVE FOR DETAILS${NC}"
fi
echo -e "${BLUE}============================================================${NC}"

echo -e "\n${CYAN}Test completed at: $(date)${NC}"

exit $FAILED_TESTS
