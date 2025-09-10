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
├── *.spec.js          # Test files (94 tests)
├── vitest.config.js   # Test configuration & Windows compatibility  
├── .prettierrc        # Code formatting rules
└── eslint.config.js   # Code linting configuration
```

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

For detailed implementation guidelines, see [CLAUDE.md](./CLAUDE.md).