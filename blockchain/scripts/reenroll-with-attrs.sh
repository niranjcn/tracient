#!/bin/bash
#
# Proper Identity Enrollment Script for Tracient
# This script registers users with attributes and enrolls them with ecert attribute requests
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

NETWORK_PATH="/mnt/e/Major-Project/fabric-samples/test-network"
export PATH="${NETWORK_PATH}/../bin:$PATH"

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  TRACIENT PROPER IDENTITY ENROLLMENT${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Function to enroll user with attributes
enroll_with_attrs() {
    local ca_name=$1
    local ca_port=$2
    local ca_cert=$3
    local username=$4
    local password=$5
    local org_path=$6
    local role=$7
    local clearance=$8
    local display_name=$9
    
    echo -e "${YELLOW}Enrolling ${display_name} with attributes...${NC}"
    
    mkdir -p "${org_path}/users/${username}/msp"
    
    # Enroll with enrollment.attrs to request attributes in the certificate
    fabric-ca-client enroll \
        -u https://${username}:${password}@localhost:${ca_port} \
        --caname ${ca_name} \
        -M "${org_path}/users/${username}/msp" \
        --enrollment.attrs "role,clearanceLevel" \
        --tls.certfiles ${ca_cert} 2>&1 || {
            echo -e "${RED}Enrollment failed for ${username}${NC}"
            return 1
        }
    
    # Copy config.yaml
    if [ -f "${org_path}/msp/config.yaml" ]; then
        cp "${org_path}/msp/config.yaml" "${org_path}/users/${username}/msp/config.yaml"
    fi
    
    echo -e "${GREEN}ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ ${display_name} enrolled with role=${role}, clearanceLevel=${clearance}${NC}"
}

# ============================================
# RE-ENROLL ALL IDENTITIES WITH ATTRIBUTES
# ============================================

ORG1_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org1.example.com"
ORG2_PATH="${NETWORK_PATH}/organizations/peerOrganizations/org2.example.com"
ORG1_CA_CERT="${NETWORK_PATH}/organizations/fabric-ca/org1/ca-cert.pem"
ORG2_CA_CERT="${NETWORK_PATH}/organizations/fabric-ca/org2/ca-cert.pem"

echo -e "${BLUE}Org1 Identities:${NC}"
export FABRIC_CA_CLIENT_HOME="${ORG1_PATH}/"

enroll_with_attrs "ca-org1" "7054" "${ORG1_CA_CERT}" "govtofficial1" "govtofficial1pw" "${ORG1_PATH}" "government_official" "9" "Govt Official 1"
enroll_with_attrs "ca-org1" "7054" "${ORG1_CA_CERT}" "govtofficial2" "govtofficial2pw" "${ORG1_PATH}" "government_official" "7" "Govt Official 2"
enroll_with_attrs "ca-org1" "7054" "${ORG1_CA_CERT}" "auditor1" "auditor1pw" "${ORG1_PATH}" "auditor" "7" "Auditor 1"
enroll_with_attrs "ca-org1" "7054" "${ORG1_CA_CERT}" "auditor2" "auditor2pw" "${ORG1_PATH}" "auditor" "5" "Auditor 2"
enroll_with_attrs "ca-org1" "7054" "${ORG1_CA_CERT}" "bankofficer1" "bankofficer1pw" "${ORG1_PATH}" "bank_officer" "6" "Bank Officer 1"
enroll_with_attrs "ca-org1" "7054" "${ORG1_CA_CERT}" "bankofficer2" "bankofficer2pw" "${ORG1_PATH}" "bank_officer" "5" "Bank Officer 2"

echo ""
echo -e "${BLUE}Org2 Identities:${NC}"
export FABRIC_CA_CLIENT_HOME="${ORG2_PATH}/"

enroll_with_attrs "ca-org2" "8054" "${ORG2_CA_CERT}" "employer1" "employer1pw" "${ORG2_PATH}" "employer" "6" "Employer 1"
enroll_with_attrs "ca-org2" "8054" "${ORG2_CA_CERT}" "employer2" "employer2pw" "${ORG2_PATH}" "employer" "5" "Employer 2"
enroll_with_attrs "ca-org2" "8054" "${ORG2_CA_CERT}" "employer3" "employer3pw" "${ORG2_PATH}" "employer" "4" "Employer 3"
enroll_with_attrs "ca-org2" "8054" "${ORG2_CA_CERT}" "worker1" "worker1pw" "${ORG2_PATH}" "worker" "2" "Worker 1"
enroll_with_attrs "ca-org2" "8054" "${ORG2_CA_CERT}" "worker2" "worker2pw" "${ORG2_PATH}" "worker" "2" "Worker 2"
enroll_with_attrs "ca-org2" "8054" "${ORG2_CA_CERT}" "worker3" "worker3pw" "${ORG2_PATH}" "worker" "1" "Worker 3"

echo ""
echo -e "${GREEN}Enrollment complete!${NC}"
echo "Attributes should now be embedded in certificates."
