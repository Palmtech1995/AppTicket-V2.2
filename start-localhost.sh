#!/usr/bin/env bash
# ============================================================================
# Xing Tai Enterprise Asset Management & IT Helpdesk System
# Standalone Localhost Launcher (Port 3000) for macOS / Linux
# ============================================================================

set -e
cd "$(dirname "$0")"

echo "============================================================================"
echo "  Xing Tai Enterprise Asset Management & IT Helpdesk System"
echo "  Standalone Localhost Launcher (Port 3000)"
echo "============================================================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed! Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies with npm install..."
    npm install
else
    echo "[1/3] Dependencies found in node_modules."
fi

# Ensure .env
if [ ! -f ".env" ]; then
    echo "[2/3] Creating .env from .env.example..."
    cp .env.example .env
else
    echo "[2/3] .env configuration file detected."
fi

echo "[3/3] Launching Node.js Express server on http://localhost:3000 ..."
echo ""

# Open default browser
if which xdg-open > /dev/null 2>&1; then
    (sleep 2 && xdg-open http://localhost:3000) &
elif which open > /dev/null 2>&1; then
    (sleep 2 && open http://localhost:3000) &
fi

npm run dev
