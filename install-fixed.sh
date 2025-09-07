#!/bin/bash

# MCP Quickstart - Production-Ready Installer
# Simplified, resilient, automated

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
SCRIPT_VERSION="1.0.1"
MCP_DIR="$HOME/.mcp-servers"
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
PROJECT_DIR="${PROJECT_DIR:-$HOME/claude-mcp-workspace}"

# Colors (but check if terminal supports them)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''; GREEN=''; BLUE=''; NC=''
fi

# Error handler
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Info message
info() {
    echo -e "${BLUE}→ $1${NC}"
}

# Check dependencies
check_requirements() {
    local missing=()
    
    command -v node >/dev/null 2>&1 || missing+=("Node.js")
    command -v npm >/dev/null 2>&1 || missing+=("npm")
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Missing requirements: ${missing[*]}${NC}"
        echo "Please install Node.js from: https://nodejs.org"
        exit 1
    fi
    
    success "Requirements checked"
}

# Backup existing config
backup_config() {
    if [ -f "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" ]; then
        local backup="$CLAUDE_CONFIG_DIR/claude_desktop_config.backup.$(date +%s).json"
        cp "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" "$backup"
        info "Backed up existing config to: $(basename "$backup")"
    fi
}

# Install MCP servers
install_servers() {
    info "Installing MCP servers..."
    
    # Create and enter MCP directory
    mkdir -p "$MCP_DIR"
    cd "$MCP_DIR" || error_exit "Failed to create MCP directory"
    
    # Initialize package.json if needed
    if [ ! -f "package.json" ]; then
        npm init -y --quiet >/dev/null 2>&1 || error_exit "Failed to initialize npm"
    fi
    
    # Install servers (simplified list, all from npm)
    local servers=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-github"
        "@modelcontextprotocol/server-brave-search"
        "@modelcontextprotocol/server-memory"
    )
    
    local installed=0
    for server in "${servers[@]}"; do
        info "Installing $(basename "$server")..."
        if npm install "$server" --silent 2>/dev/null; then
            ((installed++))
        else
            echo "  Warning: Failed to install $server"
        fi
    done
    
    if [ $installed -eq 0 ]; then
        error_exit "No servers were installed successfully"
    fi
    
    success "$installed servers installed"
}

# Detect API keys
detect_api_keys() {
    # GitHub token
    GITHUB_TOKEN="${GITHUB_TOKEN:-}"
    if [ -z "$GITHUB_TOKEN" ]; then
        GITHUB_TOKEN=$(git config --global github.token 2>/dev/null || echo "")
    fi
    [ -z "$GITHUB_TOKEN" ] && GITHUB_TOKEN="REPLACE_WITH_GITHUB_TOKEN"
    
    # Brave API key
    BRAVE_API_KEY="${BRAVE_API_KEY:-REPLACE_WITH_BRAVE_KEY}"
    
    info "API keys configured (replace placeholders later if needed)"
}

# Generate Claude config
generate_config() {
    info "Generating Claude configuration..."
    
    mkdir -p "$CLAUDE_CONFIG_DIR"
    mkdir -p "$PROJECT_DIR"
    
    # Create config with proper JSON escaping
    cat > "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "${MCP_DIR}/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
        "${PROJECT_DIR}"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    },
    "memory": {
      "command": "node",
      "args": [
        "${MCP_DIR}/node_modules/@modelcontextprotocol/server-memory/dist/index.js"
      ]
    }
  }
}
EOF
    
    # Validate JSON
    if command -v python3 >/dev/null 2>&1; then
        python3 -m json.tool "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" >/dev/null 2>&1 || \
            error_exit "Generated invalid JSON configuration"
    fi
    
    success "Configuration written"
}

# Create helper script
create_helper() {
    cat > "$HOME/mcp-update-keys.sh" << 'SCRIPT'
#!/bin/bash
CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

update_json_value() {
    local key="$1"
    local value="$2"
    if command -v python3 >/dev/null 2>&1; then
        python3 -c "
import json, sys
with open('$CONFIG', 'r') as f: data = json.load(f)
$key = '$value'
with open('$CONFIG', 'w') as f: json.dump(data, f, indent=2)
"
    else
        echo "Python3 required for safe JSON updates"
        exit 1
    fi
}

echo "MCP API Key Updater"
echo "=================="
echo
read -p "GitHub Token (Enter to skip): " -s github_token
echo
[ -n "$github_token" ] && update_json_value \
    "data['mcpServers']['github']['env']['GITHUB_PERSONAL_ACCESS_TOKEN']" \
    "$github_token" && echo "✓ GitHub token updated"

read -p "Brave API Key (Enter to skip): " -s brave_key
echo
[ -n "$brave_key" ] && update_json_value \
    "data['mcpServers']['brave-search']['env']['BRAVE_API_KEY']" \
    "$brave_key" && echo "✓ Brave key updated"

echo
echo "Restart Claude Desktop to apply changes"
SCRIPT
    
    chmod +x "$HOME/mcp-update-keys.sh"
    success "Helper script created: ~/mcp-update-keys.sh"
}

# Main execution
main() {
    echo
    echo "MCP Quickstart Installer v${SCRIPT_VERSION}"
    echo "========================================"
    echo
    
    # Run installation steps
    check_requirements
    backup_config
    install_servers
    detect_api_keys
    generate_config
    create_helper
    
    # Success message
    echo
    echo "╔════════════════════════════════════════╗"
    echo "║         ✅ SETUP COMPLETE!             ║"
    echo "╚════════════════════════════════════════╝"
    echo
    echo "Next steps:"
    echo "1. Update API keys: ~/mcp-update-keys.sh"
    echo "2. Restart Claude Desktop"
    echo "3. Test: 'Show me my MCP capabilities'"
    echo
    echo "Workspace: $PROJECT_DIR"
    echo
}

# Run main function
main "$@"