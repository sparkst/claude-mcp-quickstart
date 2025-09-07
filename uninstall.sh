#!/bin/bash

# Uninstall script for MCP Quickstart
# Cleanly removes all MCP components

echo "MCP Quickstart Uninstaller"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Confirmation
read -p "This will remove all MCP servers and configurations. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled."
    exit 1
fi

# Backup config before removing
if [ -f "$HOME/Library/Application Support/Claude/claude_desktop_config.json" ]; then
    cp "$HOME/Library/Application Support/Claude/claude_desktop_config.json" \
       "$HOME/claude_config_backup_$(date +%Y%m%d_%H%M%S).json"
    echo -e "${GREEN}✓ Config backed up to home directory${NC}"
fi

# Remove MCP servers
if [ -d "$HOME/.mcp-servers" ]; then
    rm -rf "$HOME/.mcp-servers"
    echo -e "${GREEN}✓ MCP servers removed${NC}"
fi

# Remove Claude config
if [ -f "$HOME/Library/Application Support/Claude/claude_desktop_config.json" ]; then
    rm "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    echo -e "${GREEN}✓ Claude configuration removed${NC}"
fi

# Optional: Remove workspace
read -p "Remove workspace directory? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "$HOME/claude-mcp-workspace" ]; then
        rm -rf "$HOME/claude-mcp-workspace"
        echo -e "${GREEN}✓ Workspace removed${NC}"
    fi
fi

# Remove helper scripts
rm -f "$HOME/update-mcp-keys.sh"
rm -f "$HOME/update-mcp-keys.bat"

echo ""
echo -e "${GREEN}Uninstall complete!${NC}"
echo "Your backup is saved in your home directory if you need it."
echo ""
echo "To reinstall, run: curl -sSL [install-url] | bash"
