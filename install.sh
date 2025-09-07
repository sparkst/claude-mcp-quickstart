#!/bin/bash

# MCP Quickstart - Zero to Hero in 60 seconds
# This script automates the entire MCP server setup for Claude Desktop

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                MCP QUICKSTART v1.0                    ║
║         Claude Desktop + MCP Servers Setup            ║
║              Zero Config. Pure Magic.                 ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    OS_TYPE="Mac";;
    Linux*)     OS_TYPE="Linux";;
    *)          echo -e "${RED}Unsupported OS: ${OS}${NC}"; exit 1;;
esac

echo -e "${GREEN}→ Detected OS: ${OS_TYPE}${NC}"

# Find Claude config directory
if [ "$OS_TYPE" = "Mac" ]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
else
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
fi

# Create config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Auto-detect or create project directory
if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR="$HOME/claude-mcp-workspace"
    echo -e "${YELLOW}→ Creating workspace at: $PROJECT_DIR${NC}"
    mkdir -p "$PROJECT_DIR"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}→ Installing Node.js via curl...${NC}"
    if [ "$OS_TYPE" = "Mac" ]; then
        curl -fsSL https://fnm.vercel.app/install | bash
        export PATH="$HOME/.fnm:$PATH"
        eval "$(fnm env)"
        fnm use --install-if-missing 20
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

echo -e "${GREEN}✓ Node.js ready ($(node -v))${NC}"

# Install Python if not present
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}→ Installing Python...${NC}"
    if [ "$OS_TYPE" = "Mac" ]; then
        if ! command -v brew &> /dev/null; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install python3
    else
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    fi
fi

echo -e "${GREEN}✓ Python ready ($(python3 --version))${NC}"

# Create MCP servers directory
MCP_DIR="$HOME/.mcp-servers"
mkdir -p "$MCP_DIR"

echo -e "${BLUE}→ Installing MCP servers...${NC}"

# 1. Install Filesystem MCP
echo -e "${YELLOW}  [1/5] Filesystem server...${NC}"
cd "$MCP_DIR"
npm init -y --quiet > /dev/null 2>&1
npm install @modelcontextprotocol/server-filesystem --silent

# 2. Install Lovable (GitHub integration)
echo -e "${YELLOW}  [2/5] GitHub/Lovable server...${NC}"
npm install @modelcontextprotocol/server-github --silent

# 3. Install Supabase MCP
echo -e "${YELLOW}  [3/5] Supabase server...${NC}"
git clone https://github.com/supabase/mcp-server-supabase.git supabase-mcp --quiet 2>/dev/null || true
cd supabase-mcp && npm install --silent && npm run build --silent
cd "$MCP_DIR"

# 4. Install Brave Search MCP
echo -e "${YELLOW}  [4/5] Brave Search server...${NC}"
npm install @modelcontextprotocol/server-brave-search --silent

# 5. Install Memory MCP
echo -e "${YELLOW}  [5/5] Memory server...${NC}"
npm install @modelcontextprotocol/server-memory --silent

echo -e "${GREEN}✓ All MCP servers installed${NC}"

# Auto-detect API keys from environment or create placeholders
GITHUB_TOKEN="${GITHUB_TOKEN:-$(git config --global github.token 2>/dev/null || echo "PLACEHOLDER_GITHUB_TOKEN")}"
BRAVE_API_KEY="${BRAVE_API_KEY:-PLACEHOLDER_BRAVE_KEY}"

# Detect Supabase projects or use placeholder
if command -v supabase &> /dev/null; then
    SUPABASE_PROJECT_ID=$(supabase projects list 2>/dev/null | grep -m1 "│" | awk '{print $2}' || echo "PLACEHOLDER_PROJECT")
else
    SUPABASE_PROJECT_ID="PLACEHOLDER_PROJECT"
fi

# Generate Claude config
echo -e "${BLUE}→ Generating Claude configuration...${NC}"

cat > "$CLAUDE_CONFIG_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["$MCP_DIR/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js", "$PROJECT_DIR"],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["supabase-mcp", "serve"],
      "env": {
        "SUPABASE_PROJECT_ID": "$SUPABASE_PROJECT_ID"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "$BRAVE_API_KEY"
      }
    },
    "memory": {
      "command": "node",
      "args": ["$MCP_DIR/node_modules/@modelcontextprotocol/server-memory/dist/index.js"],
      "env": {}
    }
  }
}
EOF

echo -e "${GREEN}✓ Configuration written to Claude${NC}"

# Create setup completion script
cat > "$PROJECT_DIR/complete-setup.md" << 'EOF'
# MCP Setup - Final Steps

## 🎯 Quick Actions Needed:

1. **Update API Keys** (if you have them):
   ```bash
   # Edit the config file:
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Replace PLACEHOLDER_GITHUB_TOKEN with your GitHub token
   # Replace PLACEHOLDER_BRAVE_KEY with your Brave API key
   # Replace PLACEHOLDER_PROJECT with your Supabase project ID
   ```

2. **Restart Claude Desktop**
   - Quit Claude completely (Cmd+Q)
   - Reopen Claude

3. **Test Your Setup**
   Copy this to Claude and run it:
   ```
   Test my MCP setup:
   1. List files in my workspace
   2. Search for "OpenAI news" on the web
   3. Show my recent GitHub activity
   4. Remember this: "MCP setup completed on [today's date]"
   ```

## 🚀 You're Ready!

Your MCP servers are now:
- ✅ Filesystem access to your project
- ✅ GitHub integration ready
- ✅ Supabase database operations
- ✅ Web search capabilities
- ✅ Persistent memory between chats

## 📝 Next Steps:
- Create a new project: `mkdir ~/claude-mcp-workspace/my-first-project`
- Ask Claude to help you build something amazing!
EOF

# Create API key helper script
cat > "$HOME/update-mcp-keys.sh" << 'EOF'
#!/bin/bash

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

echo "MCP API Key Updater"
echo "==================="

# GitHub Token
echo -n "Enter GitHub Personal Access Token (or press Enter to skip): "
read -s github_token
echo
if [ ! -z "$github_token" ]; then
    sed -i '' "s/PLACEHOLDER_GITHUB_TOKEN/$github_token/g" "$CONFIG_FILE"
    echo "✓ GitHub token updated"
fi

# Brave API Key  
echo -n "Enter Brave Search API Key (or press Enter to skip): "
read -s brave_key
echo
if [ ! -z "$brave_key" ]; then
    sed -i '' "s/PLACEHOLDER_BRAVE_KEY/$brave_key/g" "$CONFIG_FILE"
    echo "✓ Brave API key updated"
fi

# Supabase Project
echo -n "Enter Supabase Project ID (or press Enter to skip): "
read supabase_id
if [ ! -z "$supabase_id" ]; then
    sed -i '' "s/PLACEHOLDER_PROJECT/$supabase_id/g" "$CONFIG_FILE"
    echo "✓ Supabase project updated"
fi

echo ""
echo "Configuration updated! Please restart Claude Desktop."
EOF

chmod +x "$HOME/update-mcp-keys.sh"

# Final output
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            🎉 SETUP COMPLETE! 🎉                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Run: ${YELLOW}~/update-mcp-keys.sh${NC} to add your API keys"
echo -e "2. ${YELLOW}Restart Claude Desktop${NC}"
echo -e "3. Test with: 'Show me my MCP capabilities'"
echo ""
echo -e "${GREEN}Your workspace: $PROJECT_DIR${NC}"
echo -e "${GREEN}Setup guide: $PROJECT_DIR/complete-setup.md${NC}"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"
