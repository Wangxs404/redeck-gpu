#!/bin/bash
# ========================================
#    ReDeck FastAPI Server Startup
#    For Linux/Ubuntu Production Server
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "   ReDeck FastAPI Server Startup"
echo "========================================"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo -e "${GREEN}Working directory: $SCRIPT_DIR${NC}"

# Check if main.py exists
if [ ! -f "main.py" ]; then
    echo -e "${RED}[ERROR] main.py not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARNING] .env file not found. Copying from env.example...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${YELLOW}[WARNING] Please edit .env file with your API keys!${NC}"
    else
        echo -e "${RED}[ERROR] env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo ""
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo ""
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Check Python version
echo ""
echo "Python version:"
python --version

# Install/upgrade dependencies
echo ""
echo -e "${GREEN}Checking dependencies...${NC}"
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}Dependencies installed.${NC}"

# Check Node.js for PPTX conversion
echo ""
if command -v node &> /dev/null; then
    echo -e "${GREEN}Node.js version: $(node --version)${NC}"
    
    # Install Node.js dependencies if package.json exists
    if [ -f "scripts/package.json" ]; then
        echo "Installing Node.js dependencies..."
        cd scripts
        npm install --silent
        cd ..
    fi
else
    echo -e "${YELLOW}[WARNING] Node.js not found. PPTX conversion will not work.${NC}"
fi

# Load environment and display config
echo ""
echo "========================================"
echo "   Configuration"
echo "========================================"
source .env 2>/dev/null || true
echo "  ENV: ${ENV:-development}"
echo "  HOST: ${HOST:-0.0.0.0}"
echo "  PORT: ${PORT:-8000}"
echo "  STATIC_BASE_URL: ${STATIC_BASE_URL:-http://localhost:8000}"
echo "========================================"

# Start FastAPI server
echo ""
echo "========================================"
echo "   Starting FastAPI server..."
echo "   URL: http://${HOST:-0.0.0.0}:${PORT:-8000}"
echo "   Press Ctrl+C to stop"
echo "========================================"
echo ""

# Run with uvicorn
python main.py

