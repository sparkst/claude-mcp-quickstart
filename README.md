# Claude MCP Quickstart - Expert Edition

## Mental Model
An intelligent MCP (Model Context Protocol) configuration tool that sets up Claude Desktop with multiple AI servers and creates optimized development workspaces. Focuses on security-first token handling with masked display and validation.

## Key Entry Points
- `setup.js` - Main MCP server configuration and workspace setup
- `index.js` - CLI interface with setup, dev-mode, verify commands  
- `dev-mode.js` - Claude integration prompt generator
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
- `claude-mcp-quickstart dev-mode` - Generate Claude integration prompt with workspace context
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
- **Memory**: Conversation memory persistence (core server)
- **Supabase**: Database operations with access tokens
- **Context7**: Documentation lookup (local/remote)
- **Brave Search**: Web search capabilities
- **Tavily AI**: AI-optimized search

**Note**: GitHub and Filesystem servers removed as Claude now has built-in connectors that provide better integration.

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
├── CHANGELOG.md        # Version history and changes
├── MIGRATION.md        # Migration guide for existing users
├── package.json        # NPM configuration
├── index.js           # CLI entry point
├── setup.js           # Main setup logic & token security
├── dev-mode.js        # Claude integration prompt generator
├── test-utils.js      # Security testing utilities
├── templates/         # Workspace templates
│   ├── ai-activation.md
│   ├── usage-guide.md
│   ├── prompt-library.md
│   ├── lovable-patterns.md
│   └── project-templates/
├── *.spec.js          # Test files (94 tests)
├── vitest.config.js   # Test configuration & Windows compatibility  
├── .prettierrc        # Code formatting rules
└── eslint.config.js   # Code linting configuration
```

## New Development Workflow

The refactored version introduces a streamlined development workflow:

1. **Setup Phase**: Run `claude-mcp-quickstart` to configure MCP servers
2. **Integration Phase**: Run `claude-mcp-quickstart dev-mode` to generate Claude integration prompts
3. **Development Phase**: Use the generated prompts to establish workspace context with Claude

### Why This Change?

- **Built-in Connectors**: Claude now provides native GitHub and filesystem connectors that work better than external MCP servers
- **Better Context**: The dev-mode tool generates comprehensive workspace context instead of simple activation
- **First-time Experience**: New users get a complete integration prompt telling Claude where to look and what to save
- **Reduced Confusion**: Eliminates manual dev-mode activation steps

### Dev-Mode Tool Features

The refactored `dev-mode.js` now:
- **Detects project type** automatically (React, Next.js, Vue, Python, Rust, etc.)
- **Generates workspace context** with project structure and available MCP tools
- **Creates integration prompts** that Claude can use to understand your setup
- **Writes context files** (`.claude-context`, `.claude-integration.md`) for future reference

### Usage Example

```bash
cd your-project
claude-mcp-quickstart dev-mode
# Copy the generated prompt and paste it to Claude
```

The tool generates a comprehensive prompt that tells Claude:
- Your project directory and type
- Available MCP servers and their capabilities  
- Suggested commands and workflows
- Context to save to memory for future sessions

### Migration for Existing Users

If you're upgrading from a previous version:

1. **Update Configuration**: Run `claude-mcp-quickstart setup` to update your MCP configuration (GitHub/Filesystem servers will be automatically removed)
2. **New Workflow**: Use `claude-mcp-quickstart dev-mode` in your project directories instead of manual activation
3. **Native Connectors**: Access GitHub and filesystem features through Claude's built-in connectors instead of MCP servers

## Security Features
- Token memory clearing after use
- Input validation with regex patterns  
- Atomic configuration file writes
- JSON parsing with error recovery
- Comprehensive test coverage preventing regressions

## Development

### Prerequisites
- Node.js 18+ (tested on 18, 20)
- npm or npx

### Development Scripts
```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run lint          # Check code quality with ESLint
npm run format        # Format code with Prettier
npm run format:check  # Verify code formatting
```

### Cross-Platform Testing
This package is tested on:
- ✅ **Ubuntu Latest** (Node.js 18, 20)
- ✅ **macOS Latest** (Node.js 18, 20) 
- ✅ **Windows Latest** (Node.js 18, 20)

Windows compatibility is ensured through a custom Vite plugin that handles shebang lines in the test environment.

### Code Quality
- **Prettier** for consistent formatting
- **ESLint** for code quality
- **94 comprehensive tests** covering core functionality
- **Vitest** for fast, modern testing

### Troubleshooting CI Issues
If you encounter Windows CI failures:
- **Path issues**: Use filename checks instead of full path assertions in tests
- **Shell issues**: Add `shell: bash` to GitHub Actions steps that use wildcards or Unix commands
- **Debug command**: Use `gh run view <run-id> --log-failed` to see detailed failure logs

## Publishing

### Manual Publishing
The repository includes a manual publishing workflow for controlled NPM releases:

```bash
# Navigate to Actions tab on GitHub
# Select "NPM Publish" workflow  
# Click "Run workflow" and configure:
```

**Workflow Options:**
- **Version Type**: `patch` (1.0.1), `minor` (1.1.0), or `major` (2.0.0)  
- **Registry**: `npm` (npmjs.com) or `github` (GitHub Packages)
- **Dry Run**: Test the workflow without actually publishing

**Publishing Process:**
1. **Quality Gate** - Runs full test suite across all platforms
2. **Version Bump** - Auto-increments package.json version  
3. **Duplicate Check** - Prevents publishing existing versions
4. **Publish** - Pushes package to selected registry
5. **Git Tagging** - Creates release tags and GitHub releases

### Required Secrets
For NPM publishing, add this GitHub repository secret:
- `NPM_AUTH_TOKEN` - Your NPM authentication token

GitHub Packages publishing uses the built-in `GITHUB_TOKEN`.

**⚠️ Security Notes:**
- Never enable GitHub Actions debug logging (`ACTIONS_STEP_DEBUG`) for publishing workflows
- NPM tokens are automatically masked in workflow logs for security
- Tokens are only used during the publishing step and are not persisted

### Publishing Safety Features
- ✅ Cross-platform testing before publish
- ✅ Automatic version conflict detection  
- ✅ Dry-run mode for testing
- ✅ Git tagging with release notes
- ✅ Rollback protection via version checks

### First-Time Publishing Setup

**Step 1: Create NPM Token**
1. Log in to [npmjs.com](https://www.npmjs.com)
2. Go to Access Tokens → Generate New Token
3. Select "Automation" token type for CI/CD
4. Copy the token (starts with `npm_`)

**Step 2: Add GitHub Secret**
1. Go to your repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_AUTH_TOKEN`
4. Value: Your NPM token from Step 1
5. Click "Add secret"

**Step 3: First Publish**
1. Navigate to Actions tab → "NPM Publish" workflow
2. Click "Run workflow" → Select options → "Run workflow"
3. Monitor the workflow execution for any issues

### Troubleshooting

**Common Issues:**

- **"Version already exists"**: The workflow automatically detects and skips duplicate versions. This is normal behavior, not an error.

- **"NPM_AUTH_TOKEN not found"**: Verify the secret is added to your repository with the exact name `NPM_AUTH_TOKEN`.

- **"Quality gate failed"**: Ensure all tests pass locally before publishing:
  ```bash
  npm run test:run
  npm run lint  
  npm run format:check
  ```

- **"Git push failed"**: Check repository permissions. The workflow needs `contents: write` permission.

**Getting Help:**
- Check workflow logs in the Actions tab for detailed error messages
- Verify your NPM token has publish permissions for your package
- Ensure package.json `name` field matches your NPM package name

For detailed implementation guidelines, see [CLAUDE.md](./CLAUDE.md).

For version history and changes, see [CHANGELOG.md](./CHANGELOG.md).

For migration from previous versions, see [MIGRATION.md](./MIGRATION.md).