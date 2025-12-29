#!/bin/bash
# ============================================================================
# TRACIENT IAM - User Registration Script with Certificate Attributes
# ============================================================================
# This script registers users with custom attributes in Fabric CA
# for Attribute-Based Access Control (ABAC)
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="${SCRIPT_DIR}/.."
TEST_NETWORK_DIR="${BLOCKCHAIN_DIR}/network/test-network"
CA_DIR="${TEST_NETWORK_DIR}/organizations"

# Add Fabric binaries to PATH
export PATH="${BLOCKCHAIN_DIR}/network/bin:${PATH}"
export FABRIC_CFG_PATH="${TEST_NETWORK_DIR}/configtx"

# Function to print colored output
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v fabric-ca-client &> /dev/null; then
        print_error "fabric-ca-client not found. Please install Fabric CA client."
        exit 1
    fi
    
    if [ ! -d "$TEST_NETWORK_DIR" ]; then
        print_error "Test network directory not found: $TEST_NETWORK_DIR"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to set CA environment for an org
set_ca_env() {
    local ORG=$1
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        TLS_CERT="${CA_DIR}/fabric-ca/org1/ca-cert.pem"
        export FABRIC_CA_CLIENT_HOME="${CA_DIR}/peerOrganizations/org1.example.com"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        TLS_CERT="${CA_DIR}/fabric-ca/org2/ca-cert.pem"
        export FABRIC_CA_CLIENT_HOME="${CA_DIR}/peerOrganizations/org2.example.com"
    fi
}

# Function to register a worker
register_worker() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local DEPARTMENT=$4
    local STATE=$5
    local ORG=$6
    
    print_info "Registering worker: $USER_ID"
    set_ca_env "$ORG"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type client \
        --id.attrs "role=worker:ecert,clearanceLevel=1:ecert,department=${DEPARTMENT}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert,canBatchProcess=false:ecert" \
        --tls.certfiles "${TLS_CERT}" \
        -u https://localhost:${CA_PORT} || {
            print_warning "User ${USER_ID} may already exist, skipping..."
            return 0
        }
    
    print_success "Worker ${USER_ID} registered successfully"
}

# Function to register an employer
register_employer() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local DEPARTMENT=$4
    local STATE=$5
    local MAX_WAGE_AMOUNT=$6
    local ORG=$7
    
    print_info "Registering employer: $USER_ID"
    set_ca_env "$ORG"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type client \
        --id.attrs "role=employer:ecert,clearanceLevel=5:ecert,department=${DEPARTMENT}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,maxWageAmount=${MAX_WAGE_AMOUNT}:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canBatchProcess=true:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert" \
        --tls.certfiles "${TLS_CERT}" \
        -u https://localhost:${CA_PORT} || {
            print_warning "User ${USER_ID} may already exist, skipping..."
            return 0
        }
    
    print_success "Employer ${USER_ID} registered successfully"
}

# Function to register a government official
register_government_official() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local DEPARTMENT=$4
    local STATE=$5
    local ORG=$6
    
    print_info "Registering government official: $USER_ID"
    set_ca_env "$ORG"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type client \
        --id.attrs "role=government_official:ecert,clearanceLevel=8:ecert,department=${DEPARTMENT}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canBatchProcess=false:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert,canExport=true:ecert" \
        --tls.certfiles "${TLS_CERT}" \
        -u https://localhost:${CA_PORT} || {
            print_warning "User ${USER_ID} may already exist, skipping..."
            return 0
        }
    
    print_success "Government official ${USER_ID} registered successfully"
}

# Function to register a bank officer
register_bank_officer() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local BANK_NAME=$4
    local STATE=$5
    local ORG=$6
    
    print_info "Registering bank officer: $USER_ID"
    set_ca_env "$ORG"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type client \
        --id.attrs "role=bank_officer:ecert,clearanceLevel=4:ecert,department=${BANK_NAME}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=true:ecert,canBatchProcess=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert" \
        --tls.certfiles "${TLS_CERT}" \
        -u https://localhost:${CA_PORT} || {
            print_warning "User ${USER_ID} may already exist, skipping..."
            return 0
        }
    
    print_success "Bank officer ${USER_ID} registered successfully"
}

# Function to register an auditor
register_auditor() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local ORG=$4
    
    print_info "Registering auditor: $USER_ID"
    set_ca_env "$ORG"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type client \
        --id.attrs "role=auditor:ecert,clearanceLevel=7:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canBatchProcess=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert" \
        --tls.certfiles "${TLS_CERT}" \
        -u https://localhost:${CA_PORT} || {
            print_warning "User ${USER_ID} may already exist, skipping..."
            return 0
        }
    
    print_success "Auditor ${USER_ID} registered successfully"
}

# Function to register an admin
register_admin() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local ORG=$4
    
    print_info "Registering admin: $USER_ID"
    set_ca_env "$ORG"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type admin \
        --id.attrs "role=admin:ecert,clearanceLevel=10:ecert,idHash=${ID_HASH}:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canBatchProcess=true:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert,canExport=true:ecert" \
        --tls.certfiles "${TLS_CERT}" \
        -u https://localhost:${CA_PORT} || {
            print_warning "User ${USER_ID} may already exist, skipping..."
            return 0
        }
    
    print_success "Admin ${USER_ID} registered successfully"
}

# Function to enroll a user and get certificate
enroll_user() {
    local USER_ID=$1
    local ORG=$2
    local OUTPUT_DIR=$3
    
    print_info "Enrolling user: $USER_ID"
    set_ca_env "$ORG"
    
    mkdir -p "${OUTPUT_DIR}/${USER_ID}"
    
    export FABRIC_CA_CLIENT_HOME="${OUTPUT_DIR}/${USER_ID}"
    
    fabric-ca-client enroll \
        -u https://${USER_ID}:${USER_ID}pw@localhost:${CA_PORT} \
        --caname ${CA_NAME} \
        -M msp \
        --enrollment.attrs "role,clearanceLevel,department,state,idHash,canRecordWage,canRecordUPI,canBatchProcess,canRegisterUsers,canManageUsers,canUpdateThresholds,canFlagAnomaly,canReviewAnomaly,canGenerateReport,canReadAll,canExport" \
        --tls.certfiles "${TLS_CERT}"
    
    print_success "User ${USER_ID} enrolled successfully"
    print_info "Certificate location: ${OUTPUT_DIR}/${USER_ID}/msp"
}

# Function to show usage
show_usage() {
    echo ""
    echo "TRACIENT IAM - User Registration Script"
    echo "========================================"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  register-worker <user_id> <name> <id_hash> <department> <state> <org>"
    echo "      Register a worker with basic read access"
    echo ""
    echo "  register-employer <user_id> <name> <id_hash> <department> <state> <max_wage_amount> <org>"
    echo "      Register an employer with wage recording permissions"
    echo ""
    echo "  register-government <user_id> <name> <id_hash> <department> <state> <org>"
    echo "      Register a government official with full administrative access"
    echo ""
    echo "  register-bank-officer <user_id> <name> <id_hash> <bank_name> <state> <org>"
    echo "      Register a bank officer with UPI transaction access"
    echo ""
    echo "  register-auditor <user_id> <name> <id_hash> <org>"
    echo "      Register an auditor with read and anomaly flagging access"
    echo ""
    echo "  register-admin <user_id> <name> <id_hash> <org>"
    echo "      Register an admin with full system access"
    echo ""
    echo "  enroll <user_id> <org> <output_dir>"
    echo "      Enroll a registered user and get their certificate"
    echo ""
    echo "  register-sample-users"
    echo "      Register a set of sample users for testing (6 identities)"
    echo ""
    echo "Examples:"
    echo "  $0 register-worker worker001 \"John Doe\" abc123hash construction Karnataka org1"
    echo "  $0 register-employer employer001 \"ABC Corp\" xyz789hash manufacturing Maharashtra 500000 org1"
    echo "  $0 register-government govofficial001 \"Jane Smith\" gov456hash welfare Delhi org1"
    echo "  $0 enroll worker001 org1 ./users"
    echo ""
}

# Function to register sample users for testing - 6 identities
register_sample_users() {
    print_info "=============================================="
    print_info "  Registering 6 Sample Users for Testing"
    print_info "=============================================="
    echo ""
    
    # 1. Worker (Org2 - workers/employers typically in Org2)
    print_info "1/6 - Registering Worker..."
    register_worker "testworker" "Test Worker" "wkr001hash" "construction" "Karnataka" "org2"
    
    # 2. Employer (Org2 - records wages)
    print_info "2/6 - Registering Employer..."
    register_employer "testemployer" "Test Employer Corp" "emp001hash" "manufacturing" "Maharashtra" "500000" "org2"
    
    # 3. Government Official (Org1 - government entities)
    print_info "3/6 - Registering Government Official..."
    register_government_official "testgovofficial" "Test Govt Officer" "gov001hash" "welfare" "Delhi" "org1"
    
    # 4. Bank Officer (Org1 - financial entities)
    print_info "4/6 - Registering Bank Officer..."
    register_bank_officer "testbankofficer" "Test Bank Officer" "bnk001hash" "SBI" "Karnataka" "org1"
    
    # 5. Auditor (Org1 - oversight)
    print_info "5/6 - Registering Auditor..."
    register_auditor "testauditor" "Test Auditor" "aud001hash" "org1"
    
    # 6. Admin (Org1 - system administration)
    print_info "6/6 - Registering Admin..."
    register_admin "testadmin" "Test System Admin" "adm001hash" "org1"
    
    echo ""
    print_success "=============================================="
    print_success "  All 6 Sample Users Registered Successfully!"
    print_success "=============================================="
    echo ""
    echo "Registered Identities:"
    echo "+----------------------+----------------------+-------------------+---------+"
    echo "| User ID              | Role                 | Clearance Level   | Org     |"
    echo "+----------------------+----------------------+-------------------+---------+"
    echo "| testworker           | worker               | 1                 | org2    |"
    echo "| testemployer         | employer             | 5                 | org2    |"
    echo "| testgovofficial      | government_official  | 8                 | org1    |"
    echo "| testbankofficer      | bank_officer         | 4                 | org1    |"
    echo "| testauditor          | auditor              | 7                 | org1    |"
    echo "| testadmin            | admin                | 10                | org1    |"
    echo "+----------------------+----------------------+-------------------+---------+"
    echo ""
    echo "Password pattern: <user_id>pw (e.g., testworkerpw, testemployerpw)"
    echo ""
    echo "Next steps:"
    echo "  1. Enroll users:  ./register-users.sh enroll testworker org2 ./users"
    echo "  2. Test functions: ./test-all-functions.sh"
    echo ""
}

# Main script
main() {
    # If no arguments, show usage
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    case "$1" in
        register-worker)
            if [ $# -lt 7 ]; then
                print_error "Missing arguments for register-worker"
                show_usage
                exit 1
            fi
            check_prerequisites
            register_worker "$2" "$3" "$4" "$5" "$6" "$7"
            ;;
        register-employer)
            if [ $# -lt 8 ]; then
                print_error "Missing arguments for register-employer"
                show_usage
                exit 1
            fi
            check_prerequisites
            register_employer "$2" "$3" "$4" "$5" "$6" "$7" "$8"
            ;;
        register-government)
            if [ $# -lt 7 ]; then
                print_error "Missing arguments for register-government"
                show_usage
                exit 1
            fi
            check_prerequisites
            register_government_official "$2" "$3" "$4" "$5" "$6" "$7"
            ;;
        register-bank-officer)
            if [ $# -lt 7 ]; then
                print_error "Missing arguments for register-bank-officer"
                show_usage
                exit 1
            fi
            check_prerequisites
            register_bank_officer "$2" "$3" "$4" "$5" "$6" "$7"
            ;;
        register-auditor)
            if [ $# -lt 5 ]; then
                print_error "Missing arguments for register-auditor"
                show_usage
                exit 1
            fi
            check_prerequisites
            register_auditor "$2" "$3" "$4" "$5"
            ;;
        register-admin)
            if [ $# -lt 5 ]; then
                print_error "Missing arguments for register-admin"
                show_usage
                exit 1
            fi
            check_prerequisites
            register_admin "$2" "$3" "$4" "$5"
            ;;
        enroll)
            if [ $# -lt 4 ]; then
                print_error "Missing arguments for enroll"
                show_usage
                exit 1
            fi
            check_prerequisites
            enroll_user "$2" "$3" "$4"
            ;;
        register-sample-users)
            check_prerequisites
            register_sample_users
            ;;
        -h|--help|help)
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
