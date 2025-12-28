#!/bin/bash

# ============================================================================
# TRACIENT COMPREHENSIVE FUNCTION TEST SUITE - FIXED VERSION
# Tests all 26 chaincode functions with all 6 identities
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

cd /mnt/e/Major-Project/fabric-samples/test-network

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem

ADMIN_ORG1="${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
GOVT_OFFICIAL="${PWD}/organizations/peerOrganizations/org1.example.com/users/govtofficial1/msp"
AUDITOR="${PWD}/organizations/peerOrganizations/org1.example.com/users/auditor1/msp"
BANK_OFFICER="${PWD}/organizations/peerOrganizations/org1.example.com/users/bankofficer1/msp"
EMPLOYER="${PWD}/organizations/peerOrganizations/org2.example.com/users/employer1/msp"
WORKER="${PWD}/organizations/peerOrganizations/org2.example.com/users/worker1/msp"

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

invokeCC() {
    peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        --tls --cafile $ORDERER_CA -C mychannel -n tracient \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        -c "$1" 2>&1
}

queryCC() {
    peer chaincode query -C mychannel -n tracient -c "$1" 2>&1
}

# Improved test function with better error detection
runTest() {
    local TEST_NAME=$1
    local IDENTITY_NAME=$2
    local MSP_PATH=$3
    local ORG=$4
    local CC_ARGS=$5
    local EXPECT_SUCCESS=$6
    local IS_QUERY=${7:-false}
    
    TOTAL=$((TOTAL + 1))
    
    [ "$ORG" == "org1" ] && setOrg1 || setOrg2
    export CORE_PEER_MSPCONFIGPATH=$MSP_PATH
    
    [ "$IS_QUERY" == "true" ] && OUTPUT=$(queryCC "$CC_ARGS") || OUTPUT=$(invokeCC "$CC_ARGS")
    
    # Check for access denied patterns
    IS_DENIED=false
    if [[ "$OUTPUT" == *"access denied"* ]] || [[ "$OUTPUT" == *"ACCESS DENIED"* ]] || \
       [[ "$OUTPUT" == *"Role '"*"' not allowed"* ]] || [[ "$OUTPUT" == *"MSP '"*"' not allowed"* ]] || \
       [[ "$OUTPUT" == *"Missing required permission"* ]] || [[ "$OUTPUT" == *"Clearance level"*"below required"* ]] || \
       [[ "$OUTPUT" == *"No role attribute found"* ]]; then
        IS_DENIED=true
    fi
    
    if [ "$EXPECT_SUCCESS" == "true" ]; then
        if [ "$IS_DENIED" == "false" ] && [[ "$OUTPUT" != *"Error:"* || "$OUTPUT" == *"status:200"* ]]; then
            echo -e "${GREEN}[PASS]${NC} $TEST_NAME ($IDENTITY_NAME)"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}[FAIL]${NC} $TEST_NAME ($IDENTITY_NAME)"
            echo -e "       ${YELLOW}${OUTPUT:0:120}${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        if [ "$IS_DENIED" == "true" ]; then
            echo -e "${GREEN}[PASS]${NC} $TEST_NAME ($IDENTITY_NAME) - Correctly Denied"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}[FAIL]${NC} $TEST_NAME ($IDENTITY_NAME) - Should have been denied"
            echo -e "       ${YELLOW}${OUTPUT:0:120}${NC}"
            FAILED=$((FAILED + 1))
        fi
    fi
}

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     TRACIENT COMPREHENSIVE TEST - ALL 26 FUNCTIONS x 6 IDENTITIES        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Unique test IDs
TS=$(date +%s)
WAGE_ID="W${TS}"
UPI_ID="U${TS}"
USER_ID="USR${TS}"
WH="wh_${TS}"
EH="eh_${TS}"
UH="uh_${TS}"

# ============================================================================
echo -e "${BLUE}━━━ SECTION 1: InitLedger ━━━${NC}"
# ============================================================================
runTest "InitLedger" "Admin" "$ADMIN_ORG1" "org1" '{"function":"InitLedger","Args":[]}' "true" "false"
runTest "InitLedger" "GovtOfficial" "$GOVT_OFFICIAL" "org1" '{"function":"InitLedger","Args":[]}' "false" "false"
runTest "InitLedger" "Auditor" "$AUDITOR" "org1" '{"function":"InitLedger","Args":[]}' "false" "false"
runTest "InitLedger" "BankOfficer" "$BANK_OFFICER" "org1" '{"function":"InitLedger","Args":[]}' "false" "false"
runTest "InitLedger" "Employer" "$EMPLOYER" "org2" '{"function":"InitLedger","Args":[]}' "false" "false"
runTest "InitLedger" "Worker" "$WORKER" "org2" '{"function":"InitLedger","Args":[]}' "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 2: RecordWage ━━━${NC}"
# ============================================================================
runTest "RecordWage" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}_A\",\"$WH\",\"$EH\",\"15000\",\"INR\",\"IT\",\"2025-12-28\",\"v1\"]}" "true" "false"
runTest "RecordWage" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}_G\",\"$WH\",\"$EH\",\"15000\",\"INR\",\"Gov\",\"2025-12-28\",\"v1\"]}" "false" "false"
runTest "RecordWage" "Auditor" "$AUDITOR" "org1" "{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}_Au\",\"$WH\",\"$EH\",\"15000\",\"INR\",\"Aud\",\"2025-12-28\",\"v1\"]}" "false" "false"
runTest "RecordWage" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}_B\",\"$WH\",\"$EH\",\"15000\",\"INR\",\"Bank\",\"2025-12-28\",\"v1\"]}" "false" "false"
runTest "RecordWage" "Employer" "$EMPLOYER" "org2" "{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}_E\",\"$WH\",\"$EH\",\"15000\",\"INR\",\"Emp\",\"2025-12-28\",\"v1\"]}" "true" "false"
runTest "RecordWage" "Worker" "$WORKER" "org2" "{\"function\":\"RecordWage\",\"Args\":[\"${WAGE_ID}_W\",\"$WH\",\"$EH\",\"15000\",\"INR\",\"Wrk\",\"2025-12-28\",\"v1\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 3: ReadWage ━━━${NC}"
# ============================================================================
runTest "ReadWage" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "ReadWage" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "ReadWage" "Auditor" "$AUDITOR" "org1" "{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "ReadWage" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "ReadWage" "Employer" "$EMPLOYER" "org2" "{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "ReadWage" "Worker" "$WORKER" "org2" "{\"function\":\"ReadWage\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 4: WageExists ━━━${NC}"
# ============================================================================
runTest "WageExists" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"WageExists\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "WageExists" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"WageExists\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "WageExists" "Auditor" "$AUDITOR" "org1" "{\"function\":\"WageExists\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "WageExists" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"WageExists\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "WageExists" "Employer" "$EMPLOYER" "org2" "{\"function\":\"WageExists\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "WageExists" "Worker" "$WORKER" "org2" "{\"function\":\"WageExists\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 5: QueryWageHistory ━━━${NC}"
# ============================================================================
runTest "QueryWageHistory" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "QueryWageHistory" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "QueryWageHistory" "Auditor" "$AUDITOR" "org1" "{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "QueryWageHistory" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}_A\"]}" "false" "true"
runTest "QueryWageHistory" "Employer" "$EMPLOYER" "org2" "{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"
runTest "QueryWageHistory" "Worker" "$WORKER" "org2" "{\"function\":\"QueryWageHistory\",\"Args\":[\"${WAGE_ID}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 6: QueryWagesByWorker ━━━${NC}"
# ============================================================================
runTest "QueryWagesByWorker" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"QueryWagesByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryWagesByWorker" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"QueryWagesByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryWagesByWorker" "Auditor" "$AUDITOR" "org1" "{\"function\":\"QueryWagesByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryWagesByWorker" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"QueryWagesByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryWagesByWorker" "Employer" "$EMPLOYER" "org2" "{\"function\":\"QueryWagesByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryWagesByWorker" "Worker" "$WORKER" "org2" "{\"function\":\"QueryWagesByWorker\",\"Args\":[\"$WH\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 7: QueryWagesByEmployer ━━━${NC}"
# ============================================================================
runTest "QueryWagesByEmployer" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"$EH\"]}" "true" "true"
runTest "QueryWagesByEmployer" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"$EH\"]}" "true" "true"
runTest "QueryWagesByEmployer" "Auditor" "$AUDITOR" "org1" "{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"$EH\"]}" "true" "true"
runTest "QueryWagesByEmployer" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"$EH\"]}" "false" "true"
runTest "QueryWagesByEmployer" "Employer" "$EMPLOYER" "org2" "{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"$EH\"]}" "true" "true"
runTest "QueryWagesByEmployer" "Worker" "$WORKER" "org2" "{\"function\":\"QueryWagesByEmployer\",\"Args\":[\"$EH\"]}" "false" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 8: CalculateTotalIncome ━━━${NC}"
# ============================================================================
runTest "CalculateTotalIncome" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"CalculateTotalIncome\",\"Args\":[\"$WH\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CalculateTotalIncome" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"CalculateTotalIncome\",\"Args\":[\"$WH\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CalculateTotalIncome" "Auditor" "$AUDITOR" "org1" "{\"function\":\"CalculateTotalIncome\",\"Args\":[\"$WH\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CalculateTotalIncome" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"CalculateTotalIncome\",\"Args\":[\"$WH\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CalculateTotalIncome" "Employer" "$EMPLOYER" "org2" "{\"function\":\"CalculateTotalIncome\",\"Args\":[\"$WH\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CalculateTotalIncome" "Worker" "$WORKER" "org2" "{\"function\":\"CalculateTotalIncome\",\"Args\":[\"$WH\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 9: GetWorkerIncomeHistory ━━━${NC}"
# ============================================================================
runTest "GetWorkerIncomeHistory" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"$WH\",\"12\"]}" "true" "true"
runTest "GetWorkerIncomeHistory" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"$WH\",\"12\"]}" "true" "true"
runTest "GetWorkerIncomeHistory" "Auditor" "$AUDITOR" "org1" "{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"$WH\",\"12\"]}" "true" "true"
runTest "GetWorkerIncomeHistory" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"$WH\",\"12\"]}" "true" "true"
runTest "GetWorkerIncomeHistory" "Employer" "$EMPLOYER" "org2" "{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"$WH\",\"12\"]}" "true" "true"
runTest "GetWorkerIncomeHistory" "Worker" "$WORKER" "org2" "{\"function\":\"GetWorkerIncomeHistory\",\"Args\":[\"$WH\",\"12\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 10: BatchRecordWages ━━━${NC}"
# ============================================================================
# BatchRecordWages needs canBatchProcess permission - admin and employer
runTest "BatchRecordWages" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"BatchRecordWages\",\"Args\":[\"[]\"]}" "true" "false"
runTest "BatchRecordWages" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"BatchRecordWages\",\"Args\":[\"[]\"]}" "false" "false"
runTest "BatchRecordWages" "Auditor" "$AUDITOR" "org1" "{\"function\":\"BatchRecordWages\",\"Args\":[\"[]\"]}" "false" "false"
runTest "BatchRecordWages" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"BatchRecordWages\",\"Args\":[\"[]\"]}" "false" "false"
runTest "BatchRecordWages" "Employer" "$EMPLOYER" "org2" "{\"function\":\"BatchRecordWages\",\"Args\":[\"[]\"]}" "true" "false"
runTest "BatchRecordWages" "Worker" "$WORKER" "org2" "{\"function\":\"BatchRecordWages\",\"Args\":[\"[]\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 11: RecordUPITransaction ━━━${NC}"
# ============================================================================
runTest "RecordUPITransaction" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}_A\",\"$WH\",\"5000\",\"INR\",\"ABC\",\"9876543210\",\"REF1\",\"UPI\"]}" "true" "false"
runTest "RecordUPITransaction" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}_G\",\"$WH\",\"5000\",\"INR\",\"Gov\",\"9876543211\",\"REF2\",\"UPI\"]}" "false" "false"
runTest "RecordUPITransaction" "Auditor" "$AUDITOR" "org1" "{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}_Au\",\"$WH\",\"5000\",\"INR\",\"Aud\",\"9876543212\",\"REF3\",\"UPI\"]}" "false" "false"
runTest "RecordUPITransaction" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}_B\",\"$WH\",\"5000\",\"INR\",\"Bank\",\"9876543213\",\"REF4\",\"UPI\"]}" "true" "false"
runTest "RecordUPITransaction" "Employer" "$EMPLOYER" "org2" "{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}_E\",\"$WH\",\"5000\",\"INR\",\"Emp\",\"9876543214\",\"REF5\",\"UPI\"]}" "true" "false"
runTest "RecordUPITransaction" "Worker" "$WORKER" "org2" "{\"function\":\"RecordUPITransaction\",\"Args\":[\"${UPI_ID}_W\",\"$WH\",\"5000\",\"INR\",\"Wrk\",\"9876543215\",\"REF6\",\"UPI\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 12: ReadUPITransaction ━━━${NC}"
# ============================================================================
runTest "ReadUPITransaction" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "ReadUPITransaction" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "ReadUPITransaction" "Auditor" "$AUDITOR" "org1" "{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "ReadUPITransaction" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "ReadUPITransaction" "Employer" "$EMPLOYER" "org2" "{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "ReadUPITransaction" "Worker" "$WORKER" "org2" "{\"function\":\"ReadUPITransaction\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 13: UPITransactionExists ━━━${NC}"
# ============================================================================
runTest "UPITransactionExists" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"UPITransactionExists\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "UPITransactionExists" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"UPITransactionExists\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "UPITransactionExists" "Auditor" "$AUDITOR" "org1" "{\"function\":\"UPITransactionExists\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "UPITransactionExists" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"UPITransactionExists\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "UPITransactionExists" "Employer" "$EMPLOYER" "org2" "{\"function\":\"UPITransactionExists\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"
runTest "UPITransactionExists" "Worker" "$WORKER" "org2" "{\"function\":\"UPITransactionExists\",\"Args\":[\"${UPI_ID}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 14: QueryUPITransactionsByWorker ━━━${NC}"
# ============================================================================
runTest "QueryUPITransactionsByWorker" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryUPITransactionsByWorker" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryUPITransactionsByWorker" "Auditor" "$AUDITOR" "org1" "{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryUPITransactionsByWorker" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryUPITransactionsByWorker" "Employer" "$EMPLOYER" "org2" "{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"$WH\"]}" "true" "true"
runTest "QueryUPITransactionsByWorker" "Worker" "$WORKER" "org2" "{\"function\":\"QueryUPITransactionsByWorker\",\"Args\":[\"$WH\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 15: RegisterUser ━━━${NC}"
# ============================================================================
runTest "RegisterUser" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"RegisterUser\",\"Args\":[\"${USER_ID}_A\",\"${UH}_A\",\"worker\",\"ORG1\",\"Test User A\",\"ch1\"]}" "true" "false"
runTest "RegisterUser" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"RegisterUser\",\"Args\":[\"${USER_ID}_G\",\"${UH}_G\",\"worker\",\"ORG1\",\"Test User G\",\"ch2\"]}" "true" "false"
runTest "RegisterUser" "Auditor" "$AUDITOR" "org1" "{\"function\":\"RegisterUser\",\"Args\":[\"${USER_ID}_Au\",\"${UH}_Au\",\"worker\",\"ORG1\",\"Test User Au\",\"ch3\"]}" "false" "false"
runTest "RegisterUser" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"RegisterUser\",\"Args\":[\"${USER_ID}_B\",\"${UH}_B\",\"worker\",\"ORG1\",\"Test User B\",\"ch4\"]}" "false" "false"
runTest "RegisterUser" "Employer" "$EMPLOYER" "org2" "{\"function\":\"RegisterUser\",\"Args\":[\"${USER_ID}_E\",\"${UH}_E\",\"worker\",\"ORG2\",\"Test User E\",\"ch5\"]}" "false" "false"
runTest "RegisterUser" "Worker" "$WORKER" "org2" "{\"function\":\"RegisterUser\",\"Args\":[\"${USER_ID}_W\",\"${UH}_W\",\"worker\",\"ORG2\",\"Test User W\",\"ch6\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 16: GetUserProfile ━━━${NC}"
# ============================================================================
runTest "GetUserProfile" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"GetUserProfile\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "GetUserProfile" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"GetUserProfile\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "GetUserProfile" "Auditor" "$AUDITOR" "org1" "{\"function\":\"GetUserProfile\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "GetUserProfile" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"GetUserProfile\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "GetUserProfile" "Employer" "$EMPLOYER" "org2" "{\"function\":\"GetUserProfile\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "GetUserProfile" "Worker" "$WORKER" "org2" "{\"function\":\"GetUserProfile\",\"Args\":[\"${UH}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 17: UserExists ━━━${NC}"
# ============================================================================
runTest "UserExists" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"UserExists\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "UserExists" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"UserExists\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "UserExists" "Auditor" "$AUDITOR" "org1" "{\"function\":\"UserExists\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "UserExists" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"UserExists\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "UserExists" "Employer" "$EMPLOYER" "org2" "{\"function\":\"UserExists\",\"Args\":[\"${UH}_A\"]}" "true" "true"
runTest "UserExists" "Worker" "$WORKER" "org2" "{\"function\":\"UserExists\",\"Args\":[\"${UH}_A\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 18: VerifyUserRole ━━━${NC}"
# ============================================================================
runTest "VerifyUserRole" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"VerifyUserRole\",\"Args\":[\"${UH}_A\",\"worker\"]}" "true" "true"
runTest "VerifyUserRole" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"VerifyUserRole\",\"Args\":[\"${UH}_A\",\"worker\"]}" "true" "true"
runTest "VerifyUserRole" "Auditor" "$AUDITOR" "org1" "{\"function\":\"VerifyUserRole\",\"Args\":[\"${UH}_A\",\"worker\"]}" "true" "true"
runTest "VerifyUserRole" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"VerifyUserRole\",\"Args\":[\"${UH}_A\",\"worker\"]}" "true" "true"
runTest "VerifyUserRole" "Employer" "$EMPLOYER" "org2" "{\"function\":\"VerifyUserRole\",\"Args\":[\"${UH}_A\",\"worker\"]}" "true" "true"
runTest "VerifyUserRole" "Worker" "$WORKER" "org2" "{\"function\":\"VerifyUserRole\",\"Args\":[\"${UH}_A\",\"worker\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 19: UpdateUserStatus ━━━${NC}"
# ============================================================================
runTest "UpdateUserStatus" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"UpdateUserStatus\",\"Args\":[\"${UH}_A\",\"inactive\",\"admin\"]}" "true" "false"
runTest "UpdateUserStatus" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"UpdateUserStatus\",\"Args\":[\"${UH}_A\",\"active\",\"govt\"]}" "true" "false"
runTest "UpdateUserStatus" "Auditor" "$AUDITOR" "org1" "{\"function\":\"UpdateUserStatus\",\"Args\":[\"${UH}_A\",\"active\",\"auditor\"]}" "false" "false"
runTest "UpdateUserStatus" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"UpdateUserStatus\",\"Args\":[\"${UH}_A\",\"active\",\"bank\"]}" "false" "false"
runTest "UpdateUserStatus" "Employer" "$EMPLOYER" "org2" "{\"function\":\"UpdateUserStatus\",\"Args\":[\"${UH}_A\",\"active\",\"employer\"]}" "false" "false"
runTest "UpdateUserStatus" "Worker" "$WORKER" "org2" "{\"function\":\"UpdateUserStatus\",\"Args\":[\"${UH}_A\",\"active\",\"worker\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 20: SetPovertyThreshold ━━━${NC}"
# ============================================================================
runTest "SetPovertyThreshold" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"SetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\",\"120000\",\"admin\"]}" "true" "false"
runTest "SetPovertyThreshold" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"SetPovertyThreshold\",\"Args\":[\"TestState2\",\"BPL\",\"120000\",\"govt\"]}" "true" "false"
runTest "SetPovertyThreshold" "Auditor" "$AUDITOR" "org1" "{\"function\":\"SetPovertyThreshold\",\"Args\":[\"TestState3\",\"BPL\",\"120000\",\"auditor\"]}" "false" "false"
runTest "SetPovertyThreshold" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"SetPovertyThreshold\",\"Args\":[\"TestState4\",\"BPL\",\"120000\",\"bank\"]}" "false" "false"
runTest "SetPovertyThreshold" "Employer" "$EMPLOYER" "org2" "{\"function\":\"SetPovertyThreshold\",\"Args\":[\"TestState5\",\"BPL\",\"120000\",\"emp\"]}" "false" "false"
runTest "SetPovertyThreshold" "Worker" "$WORKER" "org2" "{\"function\":\"SetPovertyThreshold\",\"Args\":[\"TestState6\",\"BPL\",\"120000\",\"worker\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 21: GetPovertyThreshold ━━━${NC}"
# ============================================================================
runTest "GetPovertyThreshold" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"GetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\"]}" "true" "true"
runTest "GetPovertyThreshold" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"GetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\"]}" "true" "true"
runTest "GetPovertyThreshold" "Auditor" "$AUDITOR" "org1" "{\"function\":\"GetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\"]}" "true" "true"
runTest "GetPovertyThreshold" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"GetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\"]}" "true" "true"
runTest "GetPovertyThreshold" "Employer" "$EMPLOYER" "org2" "{\"function\":\"GetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\"]}" "true" "true"
runTest "GetPovertyThreshold" "Worker" "$WORKER" "org2" "{\"function\":\"GetPovertyThreshold\",\"Args\":[\"TestState1\",\"BPL\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 22: CheckPovertyStatus ━━━${NC}"
# ============================================================================
runTest "CheckPovertyStatus" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"CheckPovertyStatus\",\"Args\":[\"$WH\",\"TestState1\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CheckPovertyStatus" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"CheckPovertyStatus\",\"Args\":[\"$WH\",\"TestState1\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CheckPovertyStatus" "Auditor" "$AUDITOR" "org1" "{\"function\":\"CheckPovertyStatus\",\"Args\":[\"$WH\",\"TestState1\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CheckPovertyStatus" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"CheckPovertyStatus\",\"Args\":[\"$WH\",\"TestState1\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CheckPovertyStatus" "Employer" "$EMPLOYER" "org2" "{\"function\":\"CheckPovertyStatus\",\"Args\":[\"$WH\",\"TestState1\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"
runTest "CheckPovertyStatus" "Worker" "$WORKER" "org2" "{\"function\":\"CheckPovertyStatus\",\"Args\":[\"$WH\",\"TestState1\",\"2025-01-01\",\"2025-12-31\"]}" "true" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 23: FlagAnomaly ━━━${NC}"
# ============================================================================
runTest "FlagAnomaly" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"FlagAnomaly\",\"Args\":[\"${WAGE_ID}_A\",\"0.85\",\"Test anomaly\",\"admin\"]}" "true" "false"
runTest "FlagAnomaly" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"FlagAnomaly\",\"Args\":[\"${WAGE_ID}_E\",\"0.75\",\"Gov anomaly\",\"govt\"]}" "true" "false"
runTest "FlagAnomaly" "Auditor" "$AUDITOR" "org1" "{\"function\":\"FlagAnomaly\",\"Args\":[\"WAGE001\",\"0.80\",\"Aud anomaly\",\"auditor\"]}" "true" "false"
runTest "FlagAnomaly" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"FlagAnomaly\",\"Args\":[\"WAGE002\",\"0.70\",\"Bank anomaly\",\"bank\"]}" "false" "false"
runTest "FlagAnomaly" "Employer" "$EMPLOYER" "org2" "{\"function\":\"FlagAnomaly\",\"Args\":[\"WAGE003\",\"0.60\",\"Emp anomaly\",\"emp\"]}" "false" "false"
runTest "FlagAnomaly" "Worker" "$WORKER" "org2" "{\"function\":\"FlagAnomaly\",\"Args\":[\"WAGE004\",\"0.50\",\"Worker anomaly\",\"worker\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 24: GetFlaggedWages ━━━${NC}"
# ============================================================================
runTest "GetFlaggedWages" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}" "true" "true"
runTest "GetFlaggedWages" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}" "true" "true"
runTest "GetFlaggedWages" "Auditor" "$AUDITOR" "org1" "{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}" "true" "true"
runTest "GetFlaggedWages" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}" "false" "true"
runTest "GetFlaggedWages" "Employer" "$EMPLOYER" "org2" "{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}" "false" "true"
runTest "GetFlaggedWages" "Worker" "$WORKER" "org2" "{\"function\":\"GetFlaggedWages\",\"Args\":[\"0.5\"]}" "false" "true"

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 25: UpdateAnomalyStatus ━━━${NC}"
# ============================================================================
runTest "UpdateAnomalyStatus" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"${WAGE_ID}_A\",\"reviewed\",\"admin\"]}" "true" "false"
runTest "UpdateAnomalyStatus" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"${WAGE_ID}_E\",\"reviewed\",\"govt\"]}" "true" "false"
runTest "UpdateAnomalyStatus" "Auditor" "$AUDITOR" "org1" "{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"WAGE001\",\"dismissed\",\"auditor\"]}" "true" "false"
runTest "UpdateAnomalyStatus" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"WAGE002\",\"reviewed\",\"bank\"]}" "false" "false"
runTest "UpdateAnomalyStatus" "Employer" "$EMPLOYER" "org2" "{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"WAGE003\",\"reviewed\",\"emp\"]}" "false" "false"
runTest "UpdateAnomalyStatus" "Worker" "$WORKER" "org2" "{\"function\":\"UpdateAnomalyStatus\",\"Args\":[\"WAGE004\",\"reviewed\",\"worker\"]}" "false" "false"

sleep 2

# ============================================================================
echo -e "\n${BLUE}━━━ SECTION 26: GenerateComplianceReport ━━━${NC}"
# ============================================================================
# Valid report types: wage_summary, fraud_flags, employer_compliance
runTest "GenerateComplianceReport" "Admin" "$ADMIN_ORG1" "org1" "{\"function\":\"GenerateComplianceReport\",\"Args\":[\"2025-01-01\",\"2025-12-31\",\"wage_summary\"]}" "true" "true"
runTest "GenerateComplianceReport" "GovtOfficial" "$GOVT_OFFICIAL" "org1" "{\"function\":\"GenerateComplianceReport\",\"Args\":[\"2025-01-01\",\"2025-12-31\",\"wage_summary\"]}" "true" "true"
runTest "GenerateComplianceReport" "Auditor" "$AUDITOR" "org1" "{\"function\":\"GenerateComplianceReport\",\"Args\":[\"2025-01-01\",\"2025-12-31\",\"fraud_flags\"]}" "true" "true"
runTest "GenerateComplianceReport" "BankOfficer" "$BANK_OFFICER" "org1" "{\"function\":\"GenerateComplianceReport\",\"Args\":[\"2025-01-01\",\"2025-12-31\",\"wage_summary\"]}" "false" "true"
runTest "GenerateComplianceReport" "Employer" "$EMPLOYER" "org2" "{\"function\":\"GenerateComplianceReport\",\"Args\":[\"2025-01-01\",\"2025-12-31\",\"wage_summary\"]}" "false" "true"
runTest "GenerateComplianceReport" "Worker" "$WORKER" "org2" "{\"function\":\"GenerateComplianceReport\",\"Args\":[\"2025-01-01\",\"2025-12-31\",\"wage_summary\"]}" "false" "true"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                COMPREHENSIVE TEST RESULTS (26 Functions x 6 Identities)  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Total Tests:  ${TOTAL}"
echo -e "  ${GREEN}Passed:       ${PASSED}${NC}"
echo -e "  ${RED}Failed:       ${FAILED}${NC}"
echo ""

PASS_RATE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      ✓ ALL ${TOTAL} TESTS PASSED! IAM WORKING PERFECTLY!                        ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
elif [ $PASS_RATE -ge 95 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      PASS RATE: ${PASS_RATE}% - EXCELLENT!                                         ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║      PASS RATE: ${PASS_RATE}% - Review failed tests                                ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
fi
