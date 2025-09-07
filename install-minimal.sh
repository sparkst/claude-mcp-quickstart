#!/bin/bash
#
# MCP Quickstart - Production Ready One-Line Installer
# curl -sSL https://your-domain.com/install | bash
#
# Minimal, resilient, automated

set -euo pipefail

# Configuration
VERSION="1.0.0"
MCP_DIR="$HOME/.mcp-servers"
WORKSPACE="$HOME/claude-mcp-workspace"

# Detect OS and set Claude config path
case "$(uname -s)" in
    Darwin*) 
        CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        ;;
    Linux*)
        CLAUDE_CONFIG="$HOME/.config/claude/claude_desktop_config.json"
        ;;
    *)
        echo "Unsupported OS"
        exit 1
        ;;
esac

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required"
    echo "Install from: https://nodejs.org"
    exit 1
fi

echo "MCP Quickstart v$VERSION"
echo "========================"

# Backup existing config
if [ -f "$CLAUDE_CONFIG" ]; then
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup.$(date +%s)"
    echo "✓ Backed up existing config"
fi

# Create directories
mkdir -p "$MCP_DIR" "$WORKSPACE" "$(dirname "$CLAUDE_CONFIG")"

# Install MCP servers
echo "Installing MCP servers..."
cd "$MCP_DIR"

# Initialize npm if needed
[ ! -f package.json ] && npm init -y --quiet >/dev/null 2>&1

# Install core servers only
npm install --silent \
    @modelcontextprotocol/server-filesystem \
    @modelcontextprotocol/server-github \
    @modelcontextprotocol/server-brave-search \
    @modelcontextprotocol/server-memory 2>/dev/null || {
    echo "⚠️  Some servers failed to install"
}

# Detect API keys from environment
GITHUB_TOKEN="${GITHUB_TOKEN:-REPLACE_WITH_GITHUB_TOKEN}"
BRAVE_KEY="${BRAVE_API_KEY:-REPLACE_WITH_BRAVE_KEY}"

# Generate Claude config
cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["$MCP_DIR/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "$WORKSPACE"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"}
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {"BRAVE_API_KEY": "$BRAVE_KEY"}
    },
    "memory": {
      "command": "node",
      "args": ["$MCP_DIR/node_modules/@modelcontextprotocol/server-memory/dist/index.js"]
    }
  }
}
EOF

# Create test file
cat > "$WORKSPACE/test.txt" << 'EOF'
Test MCP with these commands:
1. List files in workspace
2. Search for "AI news"
3. Remember: "MCP is working"
EOF

# Done
echo "
✅ MCP Setup Complete!

Next steps:
1. Update API keys in: $CLAUDE_CONFIG
2. Restart Claude Desktop
3. Test: 'Show me my MCP capabilities'

Workspace: $WORKSPACE
"
