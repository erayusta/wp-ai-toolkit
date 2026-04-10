#!/usr/bin/env bash
set -euo pipefail

echo "=== WordPress AI Toolkit — MCP Installer ==="
echo ""

# Determine platform and config path
if [[ "$OSTYPE" == "darwin"* ]]; then
  CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux"* ]]; then
  CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/claude"
else
  echo "ERROR: Unsupported platform: $OSTYPE"
  echo "Manually add the MCP config. See README.md for details."
  exit 1
fi

CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

MCP_ENTRY='{
  "mcpServers": {
    "wp-ai-toolkit": {
      "command": "npx",
      "args": ["-y", "@erayusta/wp-ai-toolkit"]
    }
  }
}'

# Create config directory if needed
mkdir -p "$CONFIG_DIR"

if [ -f "$CONFIG_FILE" ]; then
  echo "Found existing config: $CONFIG_FILE"

  if command -v jq &>/dev/null; then
    # Use jq to merge
    UPDATED=$(jq '.mcpServers["wp-ai-toolkit"] = {"command": "npx", "args": ["-y", "@erayusta/wp-ai-toolkit"]}' "$CONFIG_FILE")
    echo "$UPDATED" > "$CONFIG_FILE"
    echo "Updated config with jq."
  elif command -v python3 &>/dev/null; then
    # Fallback to python
    python3 -c "
import json, sys
with open('$CONFIG_FILE', 'r') as f:
    config = json.load(f)
config.setdefault('mcpServers', {})
config['mcpServers']['wp-ai-toolkit'] = {'command': 'npx', 'args': ['-y', '@erayusta/wp-ai-toolkit']}
with open('$CONFIG_FILE', 'w') as f:
    json.dump(config, f, indent=2)
"
    echo "Updated config with python3."
  else
    echo "WARNING: Neither jq nor python3 found."
    echo "Please manually add this to $CONFIG_FILE:"
    echo ""
    echo "$MCP_ENTRY"
    exit 1
  fi
else
  echo "Creating new config: $CONFIG_FILE"
  echo "$MCP_ENTRY" > "$CONFIG_FILE"
fi

echo ""
echo "=== Done! ==="
echo "Restart Claude Desktop to activate the wp-ai-toolkit MCP server."
