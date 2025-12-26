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
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FABRIC_SAMPLES_DIR="${SCRIPT_DIR}/../fabric-samples"
TEST_NETWORK_DIR="${FABRIC_SAMPLES_DIR}/test-network"
CA_DIR="${TEST_NETWORK_DIR}/organizations"

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

# Function to register a worker
register_worker() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local DEPARTMENT=$4
    local STATE=$5
    local ORG=$6
    
    print_info "Registering worker: $USER_ID"
    
    # Set CA URL based on org
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    fi
    
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/${ORG}"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type user \
        --id.affiliation "${ORG}.department1" \
        --id.attrs "role=worker:ecert,clearanceLevel=1:ecert,department=${DEPARTMENT}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert,canBatchProcess=false:ecert" \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem" \
        -u https://localhost:${CA_PORT} \
        -M "${MSP_DIR}"
    
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
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    fi
    
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/${ORG}"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type user \
        --id.affiliation "${ORG}" \
        --id.attrs "role=employer:ecert,clearanceLevel=5:ecert,department=${DEPARTMENT}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,maxWageAmount=${MAX_WAGE_AMOUNT}:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canBatchProcess=true:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert" \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem" \
        -u https://localhost:${CA_PORT} \
        -M "${MSP_DIR}"
    
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
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    fi
    
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/${ORG}"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type user \
        --id.affiliation "${ORG}.government" \
        --id.attrs "role=government_official:ecert,clearanceLevel=10:ecert,department=${DEPARTMENT}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canBatchProcess=false:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert,canExport=true:ecert" \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem" \
        -u https://localhost:${CA_PORT} \
        -M "${MSP_DIR}"
    
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
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    fi
    
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/${ORG}"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type user \
        --id.affiliation "${ORG}.bank" \
        --id.attrs "role=bank_officer:ecert,clearanceLevel=4:ecert,department=${BANK_NAME}:ecert,state=${STATE}:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=true:ecert,canBatchProcess=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert" \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem" \
        -u https://localhost:${CA_PORT} \
        -M "${MSP_DIR}"
    
    print_success "Bank officer ${USER_ID} registered successfully"
}

# Function to register an auditor
register_auditor() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local ORG=$4
    
    print_info "Registering auditor: $USER_ID"
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    fi
    
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/${ORG}"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type user \
        --id.affiliation "${ORG}.audit" \
        --id.attrs "role=auditor:ecert,clearanceLevel=8:ecert,idHash=${ID_HASH}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canBatchProcess=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert" \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem" \
        -u https://localhost:${CA_PORT} \
        -M "${MSP_DIR}"
    
    print_success "Auditor ${USER_ID} registered successfully"
}

# Function to register an admin
register_admin() {
    local USER_ID=$1
    local NAME=$2
    local ID_HASH=$3
    local ORG=$4
    
    print_info "Registering admin: $USER_ID"
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
        MSP_DIR="${CA_DIR}/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
    fi
    
    export FABRIC_CA_CLIENT_HOME="${CA_DIR}/${ORG}"
    
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name "${USER_ID}" \
        --id.secret "${USER_ID}pw" \
        --id.type admin \
        --id.affiliation "${ORG}" \
        --id.attrs "role=admin:ecert,clearanceLevel=10:ecert,idHash=${ID_HASH}:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canBatchProcess=true:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert,canExport=true:ecert" \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem" \
        -u https://localhost:${CA_PORT} \
        -M "${MSP_DIR}"
    
    print_success "Admin ${USER_ID} registered successfully"
}

# Function to enroll a user and get certificate
enroll_user() {
    local USER_ID=$1
    local ORG=$2
    local OUTPUT_DIR=$3
    
    print_info "Enrolling user: $USER_ID"
    
    if [ "$ORG" == "org1" ]; then
        CA_NAME="ca-org1"
        CA_PORT="7054"
    else
        CA_NAME="ca-org2"
        CA_PORT="8054"
    fi
    
    mkdir -p "${OUTPUT_DIR}/${USER_ID}"
    
    export FABRIC_CA_CLIENT_HOME="${OUTPUT_DIR}/${USER_ID}"
    
    fabric-ca-client enroll \
        -u https://${USER_ID}:${USER_ID}pw@localhost:${CA_PORT} \
        --caname ${CA_NAME} \
        -M msp \
        --tls.certfiles "${CA_DIR}/fabric-ca/${ORG}/tls-cert.pem"
    
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
    echo "      Register a set of sample users for testing"
    echo ""
    echo "Examples:"
    echo "  $0 register-worker worker001 \"John Doe\" abc123hash construction Karnataka org1"
    echo "  $0 register-employer employer001 \"ABC Corp\" xyz789hash manufacturing Maharashtra 500000 org1"
    echo "  $0 register-government govofficial001 \"Jane Smith\" gov456hash welfare Delhi org1"
    echo "  $0 enroll worker001 org1 ./users"
    echo ""
}

# Function to register sample users for testing
register_sample_users() {
    print_info "Registering sample users for testing..."
    
    # Workers
    register_worker "worker001" "Ravi Kumar" "wkr001hash" "construction" "Karnataka" "org1"
    register_worker "worker002" "Priya Sharma" "wkr002hash" "agriculture" "Maharashtra" "org1"
    register_worker "worker003" "Mohammed Ali" "wkr003hash" "manufacturing" "Tamil Nadu" "org2"
    
    # Employers
    register_employer "employer001" "ABC Construction" "emp001hash" "construction" "Karnataka" "500000" "org1"
    register_employer "employer002" "XYZ Manufacturing" "emp002hash" "manufacturing" "Maharashtra" "1000000" "org2"
    
    # Government Officials
    register_government_official "govofficial001" "Dr. Lakshmi Nair" "gov001hash" "welfare" "Karnataka" "org1"
    register_government_official "govofficial002" "Rajesh Gupta" "gov002hash" "labor" "Maharashtra" "org1"
    
    # Bank Officers
    register_bank_officer "bankofficer001" "Suresh Patel" "bnk001hash" "SBI" "Karnataka" "org1"
    
    # Auditors
    register_auditor "auditor001" "Anita Desai" "aud001hash" "org1"
    
    # Admins
    register_admin "admin001" "System Admin" "adm001hash" "org1"
    
    print_success "All sample users registered successfully!"
    echo ""
    echo "Registered users:"
    echo "  - 3 Workers (worker001-003)"
    echo "  - 2 Employers (employer001-002)"
    echo "  - 2 Government Officials (govofficial001-002)"
    echo "  - 1 Bank Officer (bankofficer001)"
    echo "  - 1 Auditor (auditor001)"
    echo "  - 1 Admin (admin001)"
    echo ""
    echo "Password pattern: <user_id>pw (e.g., worker001pw)"
}

# Main script
main() {
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
