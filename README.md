# Claude MCP Quickstart - Expert Edition

## Mental Model
An intelligent MCP (Model Context Protocol) configuration tool that sets up Claude Desktop with multiple AI servers and creates optimized development workspaces. Focuses on security-first token handling with masked display and validation.

## Key Entry Points
- `setup.js` - Main MCP server configuration and workspace setup
- `index.js` - CLI interface with setup, dev-mode, verify commands  
- `dev-mode.js` - Expert development mode activation
- `templates/` - Workspace templates and AI context files
- `test-utils.js` - Testing utilities for token security functions

## Getting Started

### Installation
```bash
npm install -g claude-mcp-quickstart
```

### Quick Setup
```bash
claude-mcp-quickstart
# or
npx claude-mcp-quickstart
```

### Available Commands
- `claude-mcp-quickstart setup` - Configure MCP servers
- `claude-mcp-quickstart dev-mode` - Activate expert development mode  
- `claude-mcp-quickstart verify` - Verify current configuration
- `claude-mcp-quickstart quick-start` - Complete setup with all features

### Development Setup
```bash
npm install
npm test              # Run all tests (47 tests)
npm run typecheck     # TypeScript validation
```

## Architecture Overview

### Token Security System
- **Masked Display**: Shows first 5 + last 3 characters (`abcde********123`)
- **Memory Clearing**: Automatic token cleanup after use
- **Format Validation**: Regex patterns for GitHub, Supabase, Brave, Tavily
- **UX Workflow**: Enter (keep) / "-" (delete) / new value (replace)

### MCP Server Support  
- **Filesystem**: Local file access for workspace
- **Memory**: Conversation memory persistence
- **GitHub**: Repository integration with token validation
- **Supabase**: Database operations with access tokens
- **Context7**: Documentation lookup (local/remote)
- **Brave Search**: Web search capabilities
- **Tavily AI**: AI-optimized search

### Workspace Creation
- **Lovable.dev Integration**: Full-stack development templates
- **AI Context Files**: Specialized prompts and patterns
- **Project Templates**: Customized by development type
- **Bootstrap Lovable v2**: Framework integration

## Project Structure

```
claude-mcp-quickstart/
├── README.md           # This file
├── CLAUDE.md           # Development guidelines
├── package.json        # NPM configuration
├── index.js           # CLI entry point
├── setup.js           # Main setup logic & token security
├── dev-mode.js        # Expert development mode
├── test-utils.js      # Security testing utilities
├── templates/         # Workspace templates
│   ├── ai-activation.md
│   ├── usage-guide.md
│   ├── prompt-library.md
│   ├── lovable-patterns.md
│   └── project-templates/
└── *.spec.js          # Test files (47 tests)
```

## Security Features
- Token memory clearing after use
- Input validation with regex patterns  
- Atomic configuration file writes
- JSON parsing with error recovery
- Comprehensive test coverage preventing regressions

For detailed implementation guidelines, see [CLAUDE.md](./CLAUDE.md).