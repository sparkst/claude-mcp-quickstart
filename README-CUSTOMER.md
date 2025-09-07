# MCP Setup for Claude Desktop

## Installation (30 seconds)

### Mac/Linux:
```bash
curl -sSL https://get.your-product.com/install.sh | bash
```

### Windows:
```powershell
iwr -useb https://get.your-product.com/install.ps1 | iex
```

## Verify Installation

Run this command to check if everything is working:
```bash
curl -sSL https://get.your-product.com/verify.sh | bash
```

You should see:
```
✅ FULLY CONFIGURED!
All 11 checks passed
```

## Success Indicators

### ✅ You'll Know It Worked When:

1. **The installer shows:**
   ```
   ✅ MCP Setup Complete!
   ```

2. **The verify script shows all green checkmarks:**
   ```
   ✓ Node.js installed
   ✓ MCP directory exists
   ✓ Filesystem server
   ✓ GitHub server
   ✓ Claude config exists
   ```

3. **In Claude, this command works:**
   ```
   Show me my MCP capabilities
   ```
   
   Claude should respond with something like:
   ```
   I can see I have access to several MCP servers:
   - Filesystem access to your workspace
   - GitHub integration for repositories
   - Web search via Brave
   - Persistent memory across chats
   ```

### ❌ Signs Something Failed:

1. **Red X marks in verify script**
2. **Claude says "I don't have MCP capabilities"**
3. **Error messages during installation**

## Quick Fixes

### "Node.js is required"
Install Node.js from https://nodejs.org (takes 2 minutes)

### "Claude config not found"
Make sure Claude Desktop is installed first

### "API keys need updating"
Edit the config file and replace `REPLACE_WITH_GITHUB_TOKEN` with your actual token

## Test Commands for Claude

After setup, try these in Claude:

```
1. List all files in my workspace
2. Create a file called hello.txt with "MCP is working!"
3. Search the web for "latest AI news"
4. Remember this: "My setup date is [today]"
```

## Support

- **Installation failed?** Run verify.sh and share the output
- **Claude not responding?** Make sure you restarted Claude Desktop
- **Need help?** support@your-product.com

## What Got Installed

- **4 MCP servers** in `~/.mcp-servers/`
- **Configuration** in Claude's config directory
- **Workspace** at `~/claude-mcp-workspace/`
- **Test files** to verify everything works

Total disk space used: ~50MB
