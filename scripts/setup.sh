#!/usr/bin/env bash
set -euo pipefail

echo "=== WordPress AI Toolkit — Setup ==="
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ required. Found: $(node -v)"
  exit 1
fi
echo "Node.js $(node -v)"

# Check npm
if ! command -v npm &>/dev/null; then
  echo "ERROR: npm is not installed."
  exit 1
fi
echo "npm $(npm -v)"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Build
echo ""
echo "Building..."
npm run build

# Check WP-CLI (optional)
echo ""
if command -v wp &>/dev/null; then
  echo "WP-CLI $(wp --version 2>/dev/null || echo 'detected')"
else
  echo "WP-CLI: not found (optional — needed for manage_wp_site tool)"
  echo "  Install: brew install wp-cli (macOS) or https://wp-cli.org/#installing"
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Start the MCP server:"
echo "  npm start"
echo ""
echo "Or in development mode:"
echo "  npm run dev"
