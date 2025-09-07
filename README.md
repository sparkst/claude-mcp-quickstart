# MCP Quickstart

One-command MCP setup for Claude Desktop with guided API key configuration.

## Installation

```bash
npx mcp-quickstart
```

Follow the interactive setup wizard to configure your API keys.

## What You Get

### Core Features (No API Keys Required)
- 📁 **Filesystem Access** - Read/write files in your workspace
- 🧠 **Persistent Memory** - Remember context across chats

### Optional Features (With API Keys)
- 🔍 **Brave Search** - Private web search (2,000 free searches/month)
- 🔎 **Tavily Search** - AI-optimized search (1,000 free searches/month)
- 🐙 **GitHub Integration** - Manage repositories and code

## First Time Setup

The installer will guide you through:

1. **Search Services Setup**
   - Links to get free API keys
   - Optional - skip if not needed

2. **GitHub Integration**
   - Direct link to create token
   - Optional - skip if not needed

3. **Automatic Installation**
   - Downloads all components
   - Configures Claude Desktop
   - Creates test workspace

## Verify Installation

```bash
npx mcp-quickstart verify
```

## Add More Services Later

```bash
npx mcp-quickstart setup
```

## Test in Claude

After installation, tell Claude:
```
Show me my MCP capabilities
```

## Get API Keys

- **Brave Search**: https://api.search.brave.com/app/keys
- **Tavily Search**: https://app.tavily.com/sign-up
- **GitHub Token**: https://github.com/settings/tokens/new

## Requirements

- Node.js 16+
- Claude Desktop

## License

MIT

---

Built for the Claude community. Make Claude more powerful in 60 seconds!
