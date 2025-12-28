#!/bin/bash
#
# Comprehensive Identity and Access Control Test Script for Tracient
# Tests each identity's permissions against chaincode functions
#

# Change to test-network directory
cd /mnt/e/Major-Project/fabric-samples/test-network

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
NETWORK_PATH="/mnt/e/Major-Project/fabric-samples/test-network"
ORG1_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org1.example.com"
ORG2_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org2.example.com"
export PATH="${NETWORK_PATH}/../bin:$PATH"
export FABRIC_CFG_PATH="${NETWORK_PATH}/../config/"

# Counter for test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to run a test
run_test() {
    local test_name=$1
    local expected_result=$2  # "success" or "fail"
    local identity=$3
    local org=$4  # 1 or 2
    local function_name=$5
    shift 5
    local args="$@"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    # Set environment based on org
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
    
    echo -e -n "${CYAN}[TEST]${NC} ${test_name}... "
    
    # Run the invoke command
    result=$(peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls \
        --cafile "${NETWORK_PATH}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
        -C mychannel -n tracient \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles ${ORG1_PATH}/tlsca/tlsca.org1.example.com-cert.pem \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles ${ORG2_PATH}/tlsca/tlsca.org2.example.com-cert.pem \
        -c "{\"function\":\"${function_name}\",\"Args\":[${args}]}" 2>&1)
    
    exit_code=$?
    
    # Check if result matches expected
    if [ "$expected_result" == "success" ]; then
        if [ $exit_code -eq 0 ] && ! echo "$result" | grep -q "Access denied"; then
            echo -e "${GREEN}PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}FAILED${NC}"
            echo -e "  ${RED}Expected: Success, Got: Error${NC}"
            echo -e "  ${YELLOW}Output: ${result:0:200}...${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        # Expected failure (access denied)
        if echo "$result" | grep -q "Access denied"; then
            echo -e "${GREEN}PASSED${NC} (correctly denied)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}FAILED${NC}"
            echo -e "  ${RED}Expected: Access denied, Got: ${result:0:100}...${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    fi
}

# Function to run a query test (read-only)
run_query_test() {
    local test_name=$1
    local expected_result=$2
    local identity=$3
    local org=$4
    local function_name=$5
    shift 5
    local args="$@"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    # Set environment based on org
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
    
    echo -e -n "${CYAN}[TEST]${NC} ${test_name}... "
    
    # Run the query command
    result=$(peer chaincode query -C mychannel -n tracient \
        -c "{\"function\":\"${function_name}\",\"Args\":[${args}]}" 2>&1)
    
    exit_code=$?
    
    # Check if result matches expected
    if [ "$expected_result" == "success" ]; then
        if [ $exit_code -eq 0 ] && ! echo "$result" | grep -q "Access denied"; then
            echo -e "${GREEN}PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}FAILED${NC}"
            echo -e "  ${RED}Expected: Success${NC}"
            echo -e "  ${YELLOW}Output: ${result:0:200}...${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    else
        # Expected failure
        if echo "$result" | grep -q "Access denied"; then
            echo -e "${GREEN}PASSED${NC} (correctly denied)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        else
            echo -e "${RED}FAILED${NC}"
            echo -e "  ${RED}Expected: Access denied${NC}"
            echo -e "  ${YELLOW}Output: ${result:0:100}...${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
            return 1
        fi
    fi
}

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TRACIENT IDENTITY & ACCESS CONTROL TEST SUITE                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ADMIN TESTS (Using default Org1 Admin)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  1. ADMIN IDENTITY TESTS (Admin@org1.example.com)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Admin should have full access
run_test "Admin: InitLedger" "success" "Admin@org1.example.com" "1" "InitLedger"
run_test "Admin: SetPovertyThreshold" "success" "Admin@org1.example.com" "1" "SetPovertyThreshold" '"180000"'
run_test "Admin: RegisterUser" "success" "Admin@org1.example.com" "1" "RegisterUser" '"USER001","John Admin Test","john@test.com","1234567890","admin"'
run_query_test "Admin: GetAccessRules (query)" "success" "Admin@org1.example.com" "1" "GetAccessRules"
run_query_test "Admin: QueryWagesByUser (query)" "success" "Admin@org1.example.com" "1" "QueryWagesByUser" '"WORKER1"'

echo ""
# ============================================
# GOVERNMENT OFFICIAL TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  2. GOVERNMENT OFFICIAL TESTS (govtofficial1)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Govt official should have access to read/write operations but not system admin
run_test "GovtOfficial: RecordWage" "success" "govtofficial1" "1" "RecordWage" '"WAGE-GOV-001","WORKER1","EMP001","TechCorp","35000","2024-01-15","2024-01-01","2024-01-31","full_time"'
run_query_test "GovtOfficial: ReadWage (query)" "success" "govtofficial1" "1" "ReadWage" '"WAGE-GOV-001"'
run_test "GovtOfficial: SetPovertyThreshold" "success" "govtofficial1" "1" "SetPovertyThreshold" '"190000"'
run_test "GovtOfficial: FlagAnomaly" "success" "govtofficial1" "1" "FlagAnomaly" '"WAGE-GOV-001","Test flag","suspicious_activity"'
run_query_test "GovtOfficial: QueryWagesByUser (query)" "success" "govtofficial1" "1" "QueryWagesByUser" '"WORKER1"'
run_query_test "GovtOfficial: GenerateComplianceReport (query)" "success" "govtofficial1" "1" "GenerateComplianceReport" '"2024-01-01","2024-12-31"'

echo ""
# ============================================
# AUDITOR TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  3. AUDITOR TESTS (auditor1)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Auditor should have read-only access to most functions
run_query_test "Auditor: ReadWage (query)" "success" "auditor1" "1" "ReadWage" '"WAGE-GOV-001"'
run_query_test "Auditor: QueryWagesByUser (query)" "success" "auditor1" "1" "QueryWagesByUser" '"WORKER1"'
run_query_test "Auditor: GenerateComplianceReport (query)" "success" "auditor1" "1" "GenerateComplianceReport" '"2024-01-01","2024-12-31"'
run_query_test "Auditor: QueryFlaggedRecords (query)" "success" "auditor1" "1" "QueryFlaggedRecords"
run_test "Auditor: RecordWage (should fail)" "fail" "auditor1" "1" "RecordWage" '"WAGE-AUD-001","WORKER1","EMP001","Company","35000","2024-01-15","2024-01-01","2024-01-31","full_time"'
run_test "Auditor: SetPovertyThreshold (should fail)" "fail" "auditor1" "1" "SetPovertyThreshold" '"200000"'

echo ""
# ============================================
# BANK OFFICER TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  4. BANK OFFICER TESTS (bankofficer1)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Bank officer should have limited access - mainly verification
run_query_test "BankOfficer: ReadWage (query)" "success" "bankofficer1" "1" "ReadWage" '"WAGE-GOV-001"'
run_query_test "BankOfficer: VerifyUserEligibility (query)" "success" "bankofficer1" "1" "VerifyUserEligibility" '"WORKER1","2024"'
run_test "BankOfficer: RecordWage (should fail)" "fail" "bankofficer1" "1" "RecordWage" '"WAGE-BANK-001","WORKER1","EMP001","Company","35000","2024-01-15","2024-01-01","2024-01-31","full_time"'
run_test "BankOfficer: SetPovertyThreshold (should fail)" "fail" "bankofficer1" "1" "SetPovertyThreshold" '"200000"'

echo ""
# ============================================
# EMPLOYER TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  5. EMPLOYER TESTS (employer1)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Employer should be able to record wages and read limited data
run_test "Employer: RecordWage" "success" "employer1" "2" "RecordWage" '"WAGE-EMP-001","WORKER2","EMP001","TechCorp","45000","2024-01-20","2024-01-01","2024-01-31","full_time"'
run_query_test "Employer: ReadWage (own wage)" "success" "employer1" "2" "ReadWage" '"WAGE-EMP-001"'
run_query_test "Employer: QueryWagesByEmployer (query)" "success" "employer1" "2" "QueryWagesByEmployer" '"EMP001"'
run_test "Employer: SetPovertyThreshold (should fail)" "fail" "employer1" "2" "SetPovertyThreshold" '"200000"'
run_test "Employer: FlagAnomaly (should fail)" "fail" "employer1" "2" "FlagAnomaly" '"WAGE-EMP-001","Test","suspicious"'

echo ""
# ============================================
# WORKER TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  6. WORKER TESTS (worker1)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Worker should have very limited access - only read own data
run_query_test "Worker: QueryWagesByUser (own wages)" "success" "worker1" "2" "QueryWagesByUser" '"WORKER1"'
run_test "Worker: RecordWage (should fail)" "fail" "worker1" "2" "RecordWage" '"WAGE-WRK-001","WORKER1","EMP001","Company","35000","2024-01-15","2024-01-01","2024-01-31","full_time"'
run_test "Worker: SetPovertyThreshold (should fail)" "fail" "worker1" "2" "SetPovertyThreshold" '"200000"'
run_test "Worker: FlagAnomaly (should fail)" "fail" "worker1" "2" "FlagAnomaly" '"WAGE-001","Test","suspicious"'
run_test "Worker: RegisterUser (should fail)" "fail" "worker1" "2" "RegisterUser" '"USER999","Hacker","hack@test.com","999","admin"'

echo ""
# ============================================
# CROSS-ORG TESTS
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  7. CROSS-ORGANIZATION TESTS${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test Org2 employer accessing Org1 data
run_query_test "CrossOrg: Employer2 read wage from Org1" "success" "employer2" "2" "ReadWage" '"WAGE-GOV-001"'

# Test admin from Org2
run_test "CrossOrg: sysadmin2 SetPovertyThreshold" "success" "sysadmin2" "2" "SetPovertyThreshold" '"185000"'

echo ""
# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST RESULTS SUMMARY                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${TESTS_TOTAL}"
echo -e "Passed:       ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed:       ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ALL TESTS PASSED! IAM IS WORKING! ✓                  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              SOME TESTS FAILED! Review Results Above              ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo -e "${BLUE}Identity Permission Matrix:${NC}"
echo "┌──────────────────┬───────────┬────────────┬────────────┬───────────┬─────────┐"
echo "│ Function         │ Admin     │ Govt       │ Auditor    │ Employer  │ Worker  │"
echo "├──────────────────┼───────────┼────────────┼────────────┼───────────┼─────────┤"
echo "│ InitLedger       │ ✓         │ ✗          │ ✗          │ ✗         │ ✗       │"
echo "│ RecordWage       │ ✓         │ ✓          │ ✗          │ ✓         │ ✗       │"
echo "│ ReadWage         │ ✓         │ ✓          │ ✓          │ ✓ (own)   │ ✓ (own) │"
echo "│ SetPovertyThresh │ ✓         │ ✓          │ ✗          │ ✗         │ ✗       │"
echo "│ FlagAnomaly      │ ✓         │ ✓          │ ✗          │ ✗         │ ✗       │"
echo "│ QueryWages       │ ✓         │ ✓          │ ✓          │ ✓ (own)   │ ✓ (own) │"
echo "│ ComplianceReport │ ✓         │ ✓          │ ✓          │ ✗         │ ✗       │"
echo "│ RegisterUser     │ ✓         │ ✓          │ ✗          │ ✗         │ ✗       │"
echo "└──────────────────┴───────────┴────────────┴────────────┴───────────┴─────────┘"
echo ""
