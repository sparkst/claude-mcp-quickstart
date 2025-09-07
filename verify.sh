#!/bin/bash

# MCP Setup Verification Script
# Tells you exactly what's working and what's not

echo "MCP Setup Verification"
echo "====================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track success
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Function to check status
check() {
    local name="$1"
    local condition="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if eval "$condition" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        return 1
    fi
}

# 1. Check Node.js
check "Node.js installed" "command -v node"
if command -v node >/dev/null 2>&1; then
    echo "  Version: $(node -v)"
fi

# 2. Check npm
check "npm installed" "command -v npm"

# 3. Check MCP directory
check "MCP directory exists" "[ -d '$HOME/.mcp-servers' ]"

# 4. Check installed servers
echo
echo "Checking installed servers:"
if [ -d "$HOME/.mcp-servers/node_modules" ]; then
    check "  Filesystem server" "[ -d '$HOME/.mcp-servers/node_modules/@modelcontextprotocol/server-filesystem' ]"
    check "  GitHub server" "[ -d '$HOME/.mcp-servers/node_modules/@modelcontextprotocol/server-github' ]"
    check "  Brave Search server" "[ -d '$HOME/.mcp-servers/node_modules/@modelcontextprotocol/server-brave-search' ]"
    check "  Memory server" "[ -d '$HOME/.mcp-servers/node_modules/@modelcontextprotocol/server-memory' ]"
else
    echo -e "${RED}  No servers installed${NC}"
fi

# 5. Check Claude config
echo
echo "Checking Claude configuration:"
case "$(uname -s)" in
    Darwin*)
        CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
        ;;
    Linux*)
        CONFIG_FILE="$HOME/.config/claude/claude_desktop_config.json"
        ;;
esac

check "Claude config exists" "[ -f '$CONFIG_FILE' ]"

if [ -f "$CONFIG_FILE" ]; then
    # Check if config is valid JSON
    if command -v python3 >/dev/null 2>&1; then
        check "Config is valid JSON" "python3 -m json.tool '$CONFIG_FILE' >/dev/null 2>&1"
    fi
    
    # Check for MCP servers in config
    if grep -q "mcpServers" "$CONFIG_FILE" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} MCP servers configured"
        
        # Check for placeholder API keys
        if grep -q "REPLACE_WITH" "$CONFIG_FILE" 2>/dev/null; then
            echo -e "${YELLOW}⚠${NC}  API keys need to be updated (found placeholders)"
        else
            echo -e "${GREEN}✓${NC} API keys configured (no placeholders found)"
        fi
    else
        echo -e "${RED}✗${NC} No MCP servers in config"
    fi
fi

# 6. Check workspace
echo
check "Workspace exists" "[ -d '$HOME/claude-mcp-workspace' ]"

# 7. Check if Claude is running
echo
if pgrep -x "Claude" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Claude is running - restart required for changes"
else
    echo -e "${GREEN}✓${NC} Claude not running - ready to start"
fi

# Final report
echo
echo "=================="
echo "Verification Results:"
echo "=================="

SUCCESS_RATE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $SUCCESS_RATE -eq 100 ]; then
    echo -e "${GREEN}✅ FULLY CONFIGURED!${NC}"
    echo "All $TOTAL_CHECKS checks passed"
    echo
    echo "Next steps:"
    echo "1. Restart Claude Desktop"
    echo "2. Test with: 'Show me my MCP capabilities'"
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  PARTIALLY CONFIGURED${NC}"
    echo "$PASSED_CHECKS of $TOTAL_CHECKS checks passed (${SUCCESS_RATE}%)"
    echo
    echo "Setup is mostly complete. Check failed items above."
else
    echo -e "${RED}❌ SETUP INCOMPLETE${NC}"
    echo "$PASSED_CHECKS of $TOTAL_CHECKS checks passed (${SUCCESS_RATE}%)"
    echo
    echo "Please run the installer again or check the errors above."
fi

# Export result for scripts
exit $((TOTAL_CHECKS - PASSED_CHECKS))
