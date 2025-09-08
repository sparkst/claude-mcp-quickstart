# Claude MCP Quickstart

Quick and easy setup for Model Context Protocol (MCP) servers with Claude Desktop, featuring expert multi-disciplinary AI assistance.

## Installation

```bash
npx claude-mcp-quickstart
```

Or install globally:

```bash
npm install -g claude-mcp-quickstart
claude-mcp-quickstart setup
```

## Features

### MCP Servers
- **Filesystem** - Read/write files in your workspace
- **Memory** - Persistent knowledge storage
- **GitHub** - Code repository management
- **Supabase** - Database operations (`@joshuarileydev/supabase-mcp-server`)
- **Context7** - Documentation search (`@upstash/context7-mcp`)
- **Brave Search** - Web search (`@brave/brave-search-mcp-server`)
- **Tavily** - AI-optimized search (`tavily-mcp`)

### Expert Mode
Combines expertise from:
- Amazon Principal Engineer (system design, scalability)
- Principal Product Manager (user focus, prioritization)
- UX/UI Designer (usability, accessibility)
- Senior Developer (modern frameworks, best practices)
- QA/SDET (testing, quality assurance)

## Quick Start

### 1. Complete Setup
```bash
npx claude-mcp-quickstart quick-start
```

### 2. Configure API Keys

#### Supabase
Get your API key from your Supabase project settings.

#### Context7
Two options:
- **Remote (Recommended)**: No API key needed
  - Settings > Connectors > Add Custom Connector
  - Name: `Context7`
  - URL: `https://mcp.context7.com/mcp`
- **Local**: Requires API key from Context7

#### Brave Search
Get API key from [Brave Search API](https://brave.com/search/api/)

### 3. Restart Claude Desktop

### 4. Activate Dev Mode
In Claude, type:
```
Dev Mode
```

## Commands

### Setup Commands
```bash
claude-mcp-quickstart setup          # Interactive setup
claude-mcp-quickstart verify         # Check configuration
claude-mcp-quickstart dev-mode       # Activate expert mode
```

### Dev Mode Commands (in Claude)
```
Dev Mode                           # Activate expert mode
Dev Mode: new feature [desc]       # Build feature
Dev Mode: fix [issue]             # Debug and fix
Dev Mode: ship it                 # Deploy checklist
Dev Mode: analyze                 # Code review
```

## Configuration

The setup will modify your Claude Desktop config at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Example configuration:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/claude-mcp-workspace"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@joshuarileydev/supabase-mcp-server"],
      "env": {
        "SUPABASE_API_KEY": "your-api-key"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "your-key"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@brave/brave-search-mcp-server"],
      "env": {
        "BRAVE_API_KEY": "your-key"
      }
    }
  }
}
```

## Workspace Structure
```
~/claude-mcp-workspace/
├── DEV_MODE.md           # Activation instructions
├── BOOTSTRAP_LOVABLE.md  # Framework patterns
├── PRINCIPLES.md         # Operating principles
├── CONTEXT.md           # Combined context
└── your-projects/       # Your code
```

## Expert Mode Principles

### Communication
- Concise, direct answers
- Code over explanation
- Solutions over discussion

### Quality
- Simple over clever
- Tested over perfect
- Maintainable over optimal

### Decision Making
- User impact first
- Data-driven choices
- Progressive enhancement

## Example Usage

### Building a Feature
```
You: Dev Mode: add user authentication

Claude: [DEV MODE ACTIVE]
✓ Checking Supabase schema
✓ Implementing auth

[Working code implementation]

Setup: 10 minutes
Includes: Email/password, OAuth
Alternative: Magic links (simpler)
```

### Performance Analysis
```
You: Dev Mode: why is the app slow?

Claude: [DEV MODE ACTIVE]
✓ Analyzing performance

Bottlenecks:
1. Unindexed queries (70% impact)
2. Large bundle (2.3MB)

Fixes:
[Specific code changes]

Expected improvement: 60-70%
```

## Troubleshooting

### MCP servers not working
1. Restart Claude Desktop after setup
2. Check configuration: `claude-mcp-quickstart verify`
3. Ensure API keys are valid

### Package installation errors
Make sure you have Node.js 18+ installed:
```bash
node --version
```

### Supabase connection issues
- Use service role key for full access
- Or use anon key for client-safe operations

### Context7 not finding docs
- Try the remote connection method (no API key needed)
- Check library name spelling

## Development

### Contributing
PRs welcome! Please:
- Keep the expert persona professional
- Maintain backwards compatibility
- Add tests for new features

### Local Development
```bash
git clone https://github.com/sparkst/claude-mcp-quickstart
cd claude-mcp-quickstart
npm install
npm link
claude-mcp-quickstart setup
```

## License

MIT

## Support

- [GitHub Issues](https://github.com/sparkst/claude-mcp-quickstart/issues)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Sparkry.AI](https://sparkry.ai)

---

*Built by [Sparkry.AI](https://sparkry.ai) - Making AI development efficient and maintainable*
