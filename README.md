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

### Core MCP Servers
- **Filesystem** - Read/write files in your workspace
- **Memory** - Persistent knowledge storage
- **GitHub** - Code repository management
- **Supabase** - Database and authentication
- **Context7** - Real-time documentation search
- **Web Search** - Brave and Tavily integration

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

This will:
- Configure all MCP servers
- Set up your workspace
- Install expert mode context
- Prepare Dev Mode activation

### 2. Restart Claude Desktop

### 3. Activate Dev Mode
In Claude, type:
```
Dev Mode
```

## Commands

### Setup Commands
```bash
claude-mcp-quickstart setup          # Interactive setup
claude-mcp-quickstart add-supabase   # Add Supabase
claude-mcp-quickstart add-context7   # Add Context7
claude-mcp-quickstart verify         # Check configuration
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

### Environment Variables
Create a `.env` file in your project:

```env
GITHUB_TOKEN=your-github-token
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
BRAVE_API_KEY=your-brave-key      # Optional
TAVILY_API_KEY=your-tavily-key    # Optional
```

### Workspace Structure
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

### Architecture Review
```
You: Should we use microservices?

Claude: Current scale doesn't justify complexity.
Monolith can handle 100x load with:
- Connection pooling
- Redis caching
- CDN assets

Revisit at 10K concurrent users.
```

## Troubleshooting

### MCP servers not working
1. Restart Claude Desktop after setup
2. Check configuration: `claude-mcp-quickstart verify`
3. Ensure API keys are valid

### Dev Mode not activating
1. Check context files exist in workspace
2. Verify MCP servers are configured
3. Try "Dev Mode: check setup" command

### Context7 not finding libraries
1. Use library name, not package name
2. Check if library is in Context7 database
3. Try alternative names (React vs react)

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
- [Documentation](https://modelcontextprotocol.io)
- [Sparkry.AI](https://sparkry.ai)

---

*Built by [Sparkry.AI](https://sparkry.ai) - Making AI development efficient and maintainable*
