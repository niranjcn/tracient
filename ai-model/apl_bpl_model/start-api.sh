#!/bin/bash

echo ""
echo "========================================"
echo "  TRACIENT APL/BPL Classification API"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Set port from environment or use default
AI_MODEL_PORT=${AI_MODEL_PORT:-5001}

echo ""
echo "Starting APL/BPL Classification API on port $AI_MODEL_PORT..."
echo ""

python api.py
