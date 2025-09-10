# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **BREAKING**: Removed GitHub and Filesystem MCP servers from setup configuration
- **BREAKING**: Completely repurposed `dev-mode.js` to generate Claude integration prompts instead of simple dev mode activation
- Updated package.json to remove redundant MCP dependencies (`@modelcontextprotocol/server-filesystem` and `@modelcontextprotocol/server-github`)
- Updated setup.js to remove GitHub/filesystem configuration options

### Added
- Automatic project type detection in dev-mode (React, Next.js, Vue, Python, Rust, Go, etc.)
- Comprehensive Claude integration prompt generation with workspace context
- `.claude-context` and `.claude-integration.md` file generation for workspace persistence
- MCP server information detection and display in integration prompts
- Directory structure analysis for better workspace context

### Removed
- GitHub MCP server configuration (Claude has built-in GitHub connector)
- Filesystem MCP server configuration (Claude has built-in filesystem connector) 
- Manual dev-mode activation workflow
- Redundant MCP server dependencies from package.json

### Why These Changes?

**Client Feedback Addressed:**
- Claude now has built-in GitHub and filesystem connectors that work better than external MCP servers
- Dev-mode confusion eliminated by providing clear integration prompts instead of activation
- First-time use experience improved with comprehensive workspace setup guidance

**Benefits:**
- **Reduced Setup Complexity**: Fewer MCP servers to configure and maintain
- **Better Integration**: Native Claude connectors provide superior functionality
- **Clearer Workflow**: Generated prompts tell Claude exactly what to do and where to look
- **Persistent Context**: Files are saved for future reference and sessions

**Migration Guide:**
- Existing users should run `claude-mcp-quickstart setup` to update their configuration
- Use `claude-mcp-quickstart dev-mode` in your project directory to generate integration prompts
- Copy the generated prompt and paste it to Claude to establish workspace context

## [2.2.9] - 2024-09-10

### Fixed
- Resolved duplicate scripts section in package.json
- Enhanced production-ready manual NPM publishing workflow
- Ensured clean package distribution with proper file exclusions
- Used bash shell for Windows CI package installation

### Added
- Manual NPM publishing workflow for controlled releases
- Cross-platform testing on Ubuntu, macOS, and Windows
- Comprehensive quality gates for publishing