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
NC='\033[0m' # No Color

# Paths
NETWORK_PATH="/mnt/e/Major-Project/fabric-samples/test-network"
ORG1_CA_CERT="${NETWORK_PATH}/organizations/fabric-ca/org1/ca-cert.pem"
ORG2_CA_CERT="${NETWORK_PATH}/organizations/fabric-ca/org2/ca-cert.pem"

# Add bin to PATH
export PATH="${NETWORK_PATH}/../bin:$PATH"

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  TRACIENT IDENTITY ENROLLMENT${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

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
    
    # Register the user with attributes (use proper fabric-ca format)
    fabric-ca-client register --caname ${ca_name} \
        --id.name ${username} \
        --id.secret ${password} \
        --id.type ${user_type} \
        --id.attrs "role=${role},clearanceLevel=${clearance}" \
        --tls.certfiles ${ca_cert} 2>&1 || {
            echo -e "${RED}User ${username} may already be registered, continuing...${NC}"
        }
    
    echo -e "${YELLOW}Enrolling ${display_name}...${NC}"
    
    # Create user directory
    mkdir -p "${org_path}/users/${username}/msp"
    
    # Enroll the user (attributes are embedded in cert during registration)
    fabric-ca-client enroll \
        -u https://${username}:${password}@localhost:${ca_port} \
        --caname ${ca_name} \
        -M "${org_path}/users/${username}/msp" \
        --tls.certfiles ${ca_cert}
    
    # Copy config.yaml for NodeOUs
    if [ -f "${org_path}/msp/config.yaml" ]; then
        cp "${org_path}/msp/config.yaml" "${org_path}/users/${username}/msp/config.yaml"
    fi
    
    echo -e "${GREEN}✓ ${display_name} enrolled successfully${NC}"
    echo ""
}

# ============================================
# ORG1 IDENTITIES (Government/Public Sector)
# ============================================
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  Org1 Identities (Government Sector)${NC}"
echo -e "${BLUE}=======================================${NC}"
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
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  Org2 Identities (Private Sector)${NC}"
echo -e "${BLUE}=======================================${NC}"
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

# 3. Employer 3 - Small Business
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "employer3" "employer3pw" "client" "${ORG2_PATH}" \
    "employer" "4" "Employer 3 (LocalShop)"

# 4. Worker 1 - Registered Worker
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "worker1" "worker1pw" "client" "${ORG2_PATH}" \
    "worker" "2" "Worker 1"

# 5. Worker 2 - Registered Worker
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "worker2" "worker2pw" "client" "${ORG2_PATH}" \
    "worker" "2" "Worker 2"

# 6. Worker 3 - Registered Worker
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "worker3" "worker3pw" "client" "${ORG2_PATH}" \
    "worker" "1" "Worker 3"

# 7. Employer Admin (Org2)
register_and_enroll "ca-org2" "8054" "${ORG2_CA_CERT}" \
    "sysadmin2" "sysadmin2pw" "admin" "${ORG2_PATH}" \
    "admin" "10" "System Admin (Org2)"

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  ENROLLMENT SUMMARY${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""
echo -e "${GREEN}Org1 (Government) Identities:${NC}"
echo "  1. govtofficial1 - Government Official (Senior, Level 9)"
echo "  2. govtofficial2 - Government Official (Junior, Level 7)"
echo "  3. auditor1      - Auditor (Senior, Level 7)"
echo "  4. auditor2      - Auditor (Junior, Level 5)"
echo "  5. bankofficer1  - Bank Officer (Level 6)"
echo "  6. bankofficer2  - Bank Officer (Level 5)"
echo "  7. sysadmin1     - System Admin (Level 10)"
echo ""
echo -e "${GREEN}Org2 (Private Sector) Identities:${NC}"
echo "  1. employer1     - Employer/TechCorp (Level 6)"
echo "  2. employer2     - Employer/BuildersCo (Level 5)"
echo "  3. employer3     - Employer/LocalShop (Level 4)"
echo "  4. worker1       - Worker (Level 2)"
echo "  5. worker2       - Worker (Level 2)"
echo "  6. worker3       - Worker (Level 1)"
echo "  7. sysadmin2     - System Admin (Level 10)"
echo ""
echo -e "${GREEN}Total identities created: 14${NC}"
echo ""
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  IDENTITY ENROLLMENT COMPLETE!${NC}"
echo -e "${BLUE}=======================================${NC}"
