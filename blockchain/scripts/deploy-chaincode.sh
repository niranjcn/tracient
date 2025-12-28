#!/bin/bash
# Deploy Tracient Chaincode Script
export PATH=/usr/local/go/bin:$PATH
cd /mnt/e/Major-Project/fabric-samples/test-network

# Get version and sequence from arguments or use defaults
VERSION=${1:-"1.1"}
SEQUENCE=${2:-"2"}

./network.sh deployCC -ccn tracient -ccp ../../blockchain/chaincode/tracient -ccl go -ccv $VERSION -ccs $SEQUENCE
