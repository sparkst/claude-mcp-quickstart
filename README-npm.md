# MCP Quickstart

One-command setup for Claude Desktop MCP servers.

## Installation

```bash
npx @your-company/mcp-quickstart
```

That's it. No configuration needed.

## What It Does

Automatically installs and configures:
- 📁 **Filesystem** - Read/write files in your workspace
- 🐙 **GitHub** - Manage repositories and code
- 🔍 **Brave Search** - Search the web
- 🧠 **Memory** - Persistent memory across chats

## Verify Installation

```bash
npx @your-company/mcp-quickstart verify
```

## Requirements

- Node.js 16+
- Claude Desktop

## API Keys (Optional)

Set these environment variables before installation:
- `GITHUB_TOKEN` - GitHub personal access token
- `BRAVE_API_KEY` - Brave Search API key

Or add them later to the config file shown after installation.

## Troubleshooting

### "Node.js is required"
Install Node.js from https://nodejs.org

### "Claude not found"
Make sure Claude Desktop is installed

### Still having issues?
Run verify command and share output with support.

## Support

- Documentation: https://your-company.com/mcp/docs
- Issues: https://github.com/your-company/mcp-quickstart/issues
- Email: support@your-company.com

## License

MIT
