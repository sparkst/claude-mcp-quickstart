# Claude MCP Quickstart - Expert Edition

## Mental Model
An intelligent MCP (Model Context Protocol) configuration tool that sets up Claude Desktop with multiple AI servers and creates optimized development workspaces. Focuses on security-first token handling with masked display and validation.

## Key Entry Points
- `setup.js` - Main MCP server configuration and workspace setup
- `index.js` - CLI interface with setup, dev-mode, verify commands  
- `dev-mode.js` - Claude integration prompt generator
- `brain-connection.js` - Secure Claude brain connection orchestration (P0 security fixes)
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

## 📋 Command Guide & Workflows

### First-Time Setup Workflow
```bash
# Step 1: Configure MCP servers (required once)
npx claude-mcp-quickstart
# → Creates Claude Desktop configuration
# → Restart Claude Desktop after completion

# Step 2: Generate project integration (per project)
cd your-project
npx claude-mcp-quickstart dev-mode
# → Creates .claude-context and .claude-integration.md
# → Copy the generated prompt to Claude

# Step 3: Verify everything works
npx claude-mcp-quickstart verify
# → Checks MCP configuration status
```

### Command Reference

| Command | Purpose | Output | When to Use |
|---------|---------|---------|-------------|
| `npx claude-mcp-quickstart` | Interactive MCP server setup | Configuration file | First time setup |
| `npx claude-mcp-quickstart setup` | Same as above | Same as above | Alternative command |
| `npx claude-mcp-quickstart dev-mode` | Generate Claude integration prompt | Long text prompt + files | In each project |
| `npx claude-mcp-quickstart verify` | Check MCP configuration | Status report | Troubleshooting |
| `npx claude-mcp-quickstart quick-start` | Setup + dev-mode combined | Setup wizard + prompt | New project setup |
| `npx claude-mcp-quickstart --version` | Show version | Version number | Version checking |
| `npx claude-mcp-quickstart --help` | Show help | Command list | Need assistance |

### Understanding Command Outputs

**Setup Commands** (`npx claude-mcp-quickstart`):
- Shows interactive wizard with API key prompts
- Creates/updates Claude Desktop configuration file
- **Next step**: Restart Claude Desktop

**Dev-Mode Command** (`npx claude-mcp-quickstart dev-mode`):
- Outputs a long integration prompt to your terminal
- Creates `.claude-context` and `.claude-integration.md` files
- **Next step**: Copy the terminal output and paste into Claude

**Verify Command** (`npx claude-mcp-quickstart verify`):
- Shows status of your MCP configuration
- Reports issues with setup if any
- **Next step**: Fix reported issues or you're ready to go

### Development Setup
```bash
npm install
npm test              # Run all tests (47 brain-connection tests, 291+ total)
npm run typecheck     # TypeScript validation
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

**Issue**: "MCP servers not found in Claude"
- **Cause**: Claude Desktop not restarted after setup
- **Fix**: Completely restart Claude Desktop application

**Issue**: "Command not found" or "package not found"
- **Cause**: Package not installed or PATH issue
- **Fix**: Use `npx claude-mcp-quickstart` instead of global install

**Issue**: "Invalid API key" during setup
- **Cause**: Incorrect API key format or expired key
- **Fix**: Get new API key from provider links shown in setup wizard

**Issue**: "Permission denied" when creating config
- **Cause**: Claude Desktop config directory not writable
- **Fix**: Run with appropriate permissions or check directory ownership

**Issue**: "No project detected" in dev-mode
- **Cause**: Running dev-mode outside a project directory
- **Fix**: `cd` into your project folder first

**Issue**: Long prompt output in dev-mode is confusing
- **Expected**: This is the integration prompt for Claude
- **Action**: Copy the entire output and paste it into a new Claude conversation

### Verification Steps
Always run these to check your setup:
```bash
npx claude-mcp-quickstart --version    # Should show current version
npx claude-mcp-quickstart verify       # Should show ✅ status messages
```

### Getting Help
- **Documentation**: See [USER_GUIDE.md](./USER_GUIDE.md) for step-by-step instructions
- **Issues**: Report bugs at [GitHub Issues](https://github.com/sparkst/mcp-quickstart/issues)
- **Before reporting**: Include output of `npx claude-mcp-quickstart verify`

## Architecture Overview

### 🚨 Critical Architecture Correction (v2.3.x)

**FIXED**: Major architecture understanding correction that prevents false "broken configuration" warnings for working setups.

**Problem Resolved**: Previous versions incorrectly treated Claude Desktop's built-in tools (Filesystem, Context7, GitHub) as MCP servers, causing false positive errors for users with properly configured systems.

**Solution**: System now correctly distinguishes:
- **Built-in Extensions**: Filesystem, Context7 (Settings → Extensions)
- **Built-in Connectors**: GitHub (Settings → Connectors) 
- **Custom MCP Servers**: memory, supabase, brave, tavily (managed via `claude_desktop_config.json`)

### Current Architecture (Post-Correction)

**Built-in Claude Desktop Features** (managed via Settings UI):
- **Filesystem Access**: Settings → Extensions → Filesystem
- **Documentation/Context**: Settings → Extensions → Context7
- **GitHub Integration**: Settings → Connectors → GitHub

**Custom MCP Servers** (managed via configuration file):
- **Memory**: Conversation memory persistence (core server)
- **Supabase**: Database operations with access tokens  
- **Brave Search**: Web search capabilities
- **Tavily AI**: AI-optimized search

### Token Security System
- **Masked Display**: Shows first 5 + last 3 characters (`abcde********123`)
- **Memory Clearing**: Automatic token cleanup after use
- **Format Validation**: Regex patterns for GitHub, Supabase, Brave, Tavily
- **UX Workflow**: Enter (keep) / "-" (delete) / new value (replace)

### Validation Strategy
- **Built-in Tools**: Tested through direct Claude tool calls (no MCP config validation)
- **Custom MCP Servers**: Validated through MCP configuration and server responses
- **Troubleshooting**: Directs users to correct Settings sections for built-in features

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
├── ARCHITECTURE.md     # Claude Desktop architecture reference
├── TEST_ARCHITECTURE.md # Test suite architecture and REQ-402 refactoring documentation
├── docs/TESTING_PATTERNS.md # Quick reference for modern testing patterns
├── package.json        # NPM configuration
├── index.js           # CLI entry point
├── setup.js           # Main setup logic & token security
├── dev-mode.js        # Claude integration prompt generator
├── brain-connection.js # Secure brain connection with P0 security fixes
├── test-utils.js      # Security testing utilities
├── templates/         # Workspace templates
│   ├── ai-activation.md
│   ├── usage-guide.md
│   ├── prompt-library.md
│   ├── lovable-patterns.md
│   └── project-templates/
├── *.spec.js          # Test files (291 tests)
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
- **Enhanced Security**: Native extensions offer improved access control and security models  
- **Better Performance**: Native connectors eliminate external process overhead and provide faster response times
- **Simplified Setup**: Fewer external dependencies to manage, configure, and troubleshoot
- **Future-Proof**: Migration path ensures compatibility with Claude's evolving feature set

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

1. **Graceful Deprecation**: When running `claude-mcp-quickstart setup`, deprecated servers (GitHub/Filesystem) will show confirmation prompts
2. **Choose Your Path**: You can continue using deprecated servers (discouraged) or migrate to Claude Settings
3. **Recommended Migration**: 
   - **GitHub**: Go to Claude Settings → Connectors → GitHub for better performance and native integration
   - **Filesystem**: Go to Claude Settings → Extensions → Filesystem for improved security and file access control
   - **Context7**: Go to Claude Settings → Extensions for documentation and context features
4. **No Forced Changes**: Existing configurations remain functional while you decide when to migrate

## Deprecation Approach

This package implements a **graceful deprecation strategy** that prioritizes user choice and backward compatibility:

### What You'll See
- **⚠️ Deprecation Warnings**: Clear messages explaining why native alternatives are better
- **Confirmation Prompts**: Choose whether to proceed with deprecated servers or migrate
- **Migration Guidance**: Step-by-step instructions for using Claude Settings
- **Performance Benefits**: Explanations of why native connectors are superior

### No Breaking Changes
- **Existing configurations preserved** - your current setup continues working
- **Optional migration** - upgrade when you're ready, not when we force it
- **Clear benefits explained** - understand why migration improves your experience

### Example Experience
```bash
⚠️  GitHub MCP Server is deprecated!
Recommended: Use Claude Settings → Connectors → GitHub instead
This provides better performance and native integration.

? Continue with deprecated GitHub MCP server anyway? (y/N)
```

## Security Features
- **🚨 Template Injection Protection (P0 Fix)**: All user inputs in brain-connection module properly escaped to prevent code execution
- **Input Sanitization**: Comprehensive HTML/markdown escaping for projectPath, projectType, and mcpServers
- **XSS Prevention**: Generated markdown files secured against script injection attacks
- **Token Security**: Memory clearing after use and masked display during input
- **Input Validation**: Regex patterns for GitHub, Supabase, Brave, and Tavily tokens  
- **Error Boundaries**: Structured exception handling prevents crashes from malformed data
- **JSON Validation**: Robust parsing with fallback behavior for status files
- **Deprecation Safety**: Confirmation prompts before proceeding with deprecated servers
- **Configuration Protection**: Atomic file writes and JSON parsing with error recovery
- **Migration Security**: Existing tokens preserved during configuration updates
- **Comprehensive Testing**: 291+ tests covering architectural validation, security patterns, injection prevention, capability counting systems, and reliability flows

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
- **291+ comprehensive tests** including 47 brain-connection tests covering architectural validation, security injection prevention, and capability counting systems
- **Vitest** for fast, modern testing
- **Security-First Testing**: Dedicated test suite for template injection, XSS prevention, and error boundaries

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

For Claude Desktop architecture reference, see [ARCHITECTURE.md](./ARCHITECTURE.md).

For test suite architecture and REQ-402 refactoring details, see [TEST_ARCHITECTURE.md](./TEST_ARCHITECTURE.md).