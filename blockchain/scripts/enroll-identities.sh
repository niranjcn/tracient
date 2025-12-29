#!/bin/bash
#
# Enrollment Script for Tracient Blockchain Identity Management
# This script registers and enrolls all required identities with proper attributes
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths - Use the test-network in blockchain/network folder
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BLOCKCHAIN_DIR="${SCRIPT_DIR}/.."
NETWORK_PATH="${BLOCKCHAIN_DIR}/network/test-network"
ORG1_CA_CERT="${NETWORK_PATH}/organizations/fabric-ca/org1/ca-cert.pem"
ORG2_CA_CERT="${NETWORK_PATH}/organizations/fabric-ca/org2/ca-cert.pem"

# Add bin to PATH
export PATH="${BLOCKCHAIN_DIR}/network/bin:$PATH"

echo ""
echo "======================================="
echo "  TRACIENT IDENTITY ENROLLMENT"
echo "======================================="
echo ""

# Check if CA cert exists
if [ ! -f "$ORG1_CA_CERT" ]; then
    echo -e "${RED}[ERROR]${NC} CA cert not found at: $ORG1_CA_CERT"
    echo "Make sure the network is running with CA enabled."
    echo "Run: ./fresh-start.sh to restart the network with CAs"
    exit 1
fi

# Function to set Org1 CA admin environment
set_org1_ca_admin() {
    export FABRIC_CA_CLIENT_HOME="${NETWORK_PATH}/organizations/peerOrganizations/org1.example.com/"
}

# Function to set Org2 CA admin environment
set_org2_ca_admin() {
    export FABRIC_CA_CLIENT_HOME="${NETWORK_PATH}/organizations/peerOrganizations/org2.example.com/"
}

# Function to register and enroll a user with attributes
register_and_enroll() {
    local ca_name=$1
    local ca_port=$2
    local ca_cert=$3
    local username=$4
    local password=$5
    local user_type=$6
    local org_path=$7
    local role=$8
    local clearance=$9
    local display_name=${10}
    
    echo -e "${YELLOW}Registering ${display_name} (${username})...${NC}"
    
    # Register the user with attributes
    fabric-ca-client register --caname ${ca_name} \
        --id.name ${username} \
        --id.secret ${password} \
        --id.type ${user_type} \
        --id.attrs "role=${role},clearanceLevel=${clearance}" \
        --tls.certfiles ${ca_cert} 2>&1 || {
            echo -e "${YELLOW}User ${username} may already be registered, continuing...${NC}"
        }
    
    echo -e "${YELLOW}Enrolling ${display_name}...${NC}"
    
    # Create user directory
    mkdir -p "${org_path}/users/${username}/msp"
    
    # Enroll the user
    fabric-ca-client enroll \
        -u https://${username}:${password}@localhost:${ca_port} \
        --caname ${ca_name} \
        -M "${org_path}/users/${username}/msp" \
        --tls.certfiles ${ca_cert} || {
            echo -e "${YELLOW}Enrollment failed for ${username}, may already be enrolled${NC}"
            return 0
        }
    
    # Copy config.yaml for NodeOUs
    if [ -f "${org_path}/msp/config.yaml" ]; then
        cp "${org_path}/msp/config.yaml" "${org_path}/users/${username}/msp/config.yaml"
    fi
    
    echo -e "${GREEN}[OK] ${display_name} enrolled successfully${NC}"
    echo ""
}

# ============================================
# ORG1 IDENTITIES (Government/Public Sector)
# ============================================
echo "======================================="
echo "  Org1 Identities (Government Sector)"
echo "======================================="
echo ""

set_org1_ca_admin
ORG1_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org1.example.com"

# 1. Government Official 1 - Senior (High clearance)
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "govtofficial1" "govtofficial1pw" "client" "${ORG1_PATH}" \
    "government_official" "9" "Government Official 1 (Senior)"

# 2. Government Official 2 - Junior (Medium clearance)
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "govtofficial2" "govtofficial2pw" "client" "${ORG1_PATH}" \
    "government_official" "7" "Government Official 2 (Junior)"

# 3. Auditor 1 - Senior Auditor
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "auditor1" "auditor1pw" "client" "${ORG1_PATH}" \
    "auditor" "7" "Auditor 1 (Senior)"

# 4. Auditor 2 - Junior Auditor
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "auditor2" "auditor2pw" "client" "${ORG1_PATH}" \
    "auditor" "5" "Auditor 2 (Junior)"

# 5. Bank Officer 1
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "bankofficer1" "bankofficer1pw" "client" "${ORG1_PATH}" \
    "bank_officer" "6" "Bank Officer 1"

# 6. Bank Officer 2
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "bankofficer2" "bankofficer2pw" "client" "${ORG1_PATH}" \
    "bank_officer" "5" "Bank Officer 2"

# 7. System Admin (Org1)
register_and_enroll "ca-org1" "7054" "${ORG1_CA_CERT}" \
    "sysadmin1" "sysadmin1pw" "admin" "${ORG1_PATH}" \
    "admin" "10" "System Admin (Org1)"

# ============================================
# ORG2 IDENTITIES (Private Sector/Employers)
# ============================================
echo "======================================="
echo "  Org2 Identities (Private Sector)"
echo "======================================="
echo ""

set_org2_ca_admin
ORG2_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org2.example.com"

# 1. Employer 1 - Large Corporation
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "employer1" "employer1pw" "client" "${ORG2_PATH}" \
    "employer" "6" "Employer 1 (TechCorp)"

# 2. Employer 2 - Medium Business
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "employer2" "employer2pw" "client" "${ORG2_PATH}" \
    "employer" "5" "Employer 2 (BuildersCo)"

# 3. Worker 1 - Skilled Worker
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "worker1" "worker1pw" "client" "${ORG2_PATH}" \
    "worker" "2" "Worker 1 (Skilled)"

# 4. Worker 2 - Unskilled Worker
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "worker2" "worker2pw" "client" "${ORG2_PATH}" \
    "worker" "1" "Worker 2 (Unskilled)"

# 5. System Admin (Org2)
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "sysadmin2" "sysadmin2pw" "admin" "${ORG2_PATH}" \
    "admin" "10" "System Admin (Org2)"

echo "======================================="
echo "  ENROLLMENT COMPLETE"
echo "======================================="
echo ""
echo "Summary of enrolled identities:"
echo ""
echo "Org1 (Government Sector):"
echo "  - govtofficial1 (clearance: 9)"
echo "  - govtofficial2 (clearance: 7)"
echo "  - auditor1 (clearance: 7)"
echo "  - auditor2 (clearance: 5)"
echo "  - bankofficer1 (clearance: 6)"
echo "  - bankofficer2 (clearance: 5)"
echo "  - sysadmin1 (clearance: 10)"
echo ""
echo "Org2 (Private Sector):"
echo "  - employer1 (clearance: 6)"
echo "  - employer2 (clearance: 5)"
echo "  - worker1 (clearance: 2)"
echo "  - worker2 (clearance: 1)"
echo "  - sysadmin2 (clearance: 10)"
echo ""
echo "Next steps:"
echo "  1. Run test-all-functions.sh to test chaincode with these identities"
echo "  2. Use register-users.sh for custom user registration"
echo ""
