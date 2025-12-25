#!/bin/bash
#
# TRACIENT Blockchain - Fresh Start (Complete Cleanup)
# 
# This script performs a COMPLETE cleanup and fresh start.
# ALL DATA WILL BE LOST - use only when you want to start completely fresh.
#
# Usage:
#   ./fresh-start.sh              # Cleanup and restart
#   ./fresh-start.sh --cleanup    # Cleanup only, don't restart
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Auto-detect script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NETWORK_DIR="${SCRIPT_DIR}/network/test-network"

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      TRACIENT Fresh Start (Complete Cleanup)               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will DELETE ALL BLOCKCHAIN DATA!${NC}"
echo ""

# Parse arguments
CLEANUP_ONLY=false
for arg in "$@"; do
    case $arg in
        --cleanup|-c)
            CLEANUP_ONLY=true
            ;;
        --yes|-y)
            AUTO_CONFIRM=true
            ;;
    esac
done

# Confirm unless auto-confirmed
if [ "$AUTO_CONFIRM" != true ]; then
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi
fi

echo ""
echo "[1/5] Stopping network..."
cd "$NETWORK_DIR" || { print_error "Network directory not found"; exit 1; }

# Stop network and remove volumes
./network.sh down 2>/dev/null || true
print_status "Network stopped"

echo "[2/5] Removing chaincode containers..."
docker rm -f $(docker ps -aq --filter name=dev-peer) 2>/dev/null || true
print_status "Chaincode containers removed"

echo "[3/5] Removing chaincode images..."
docker rmi -f $(docker images -q 'dev-peer*') 2>/dev/null || true
print_status "Chaincode images removed"

echo "[4/5] Cleaning up files..."
rm -f tracient.tar.gz 2>/dev/null || true
rm -f "${SCRIPT_DIR}/set-env.sh" 2>/dev/null || true
print_status "Temporary files removed"

echo "[5/5] Pruning Docker volumes..."
docker volume prune -f 2>/dev/null || true
print_status "Docker volumes pruned"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Complete Cleanup Done${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ "$CLEANUP_ONLY" = true ]; then
    echo "Cleanup complete. Network is now stopped."
    echo ""
    echo "To start fresh, run:"
    echo "  ./start-network.sh"
else
    echo "Starting fresh network..."
    echo ""
    
    # Call start-network.sh with clean flag
    cd "$SCRIPT_DIR"
    bash ./start-network.sh clean
fi
