# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- **🚨 CRITICAL P0 FIX**: Resolved template injection vulnerability in brain-connection.js by implementing comprehensive HTML/markdown escaping for all user inputs
- **Input Sanitization**: All user-controlled data (projectPath, projectType, mcpServers) now properly escaped before template interpolation
- **XSS Prevention**: Enhanced security for generated markdown files prevents script injection attacks

### Added
- **Brain Connection Security Suite**: Complete rewrite of brain-connection.js with security-first design principles
- **Comprehensive Test Coverage**: Added 18 new security and reliability tests for brain-connection module (152 total tests)  
- **Enhanced Error Boundaries**: Structured error handling prevents crashes and provides consistent API responses
- **Resource Management**: Improved connection polling with exponential backoff and proper cleanup
- **JSON Validation**: Robust validation for connection status files with graceful error handling
- **Graceful Deprecation System**: Confirmation prompts for GitHub and Filesystem MCP servers with clear migration guidance
- **Claude Settings Integration**: Comprehensive guidance directing users to Claude's native Connectors (GitHub, Cloudflare) and Extensions (Filesystem)
- **Backward Compatibility**: Deprecated servers remain functional for existing users while discouraging new adoption
- **Migration Messaging**: Clear explanations of why native alternatives are superior

### Changed
- **GitHub MCP Server**: Now deprecated with confirmation prompt directing users to Claude Settings → Connectors → GitHub
- **Filesystem MCP Server**: Now deprecated with confirmation prompt directing users to Claude Settings → Extensions → Filesystem  
- **Context7 MCP Server**: Removed from setup choices, users directed to Claude Settings → Extensions
- **Dev-Mode Integration**: Updated to include Claude Settings guidance for enhanced capabilities
- **Package Dependencies**: Removed @upstash/context7-mcp dependency

### Deprecated
- **GitHub MCP Server**: Use Claude Settings → Connectors → GitHub for better performance and native integration
- **Filesystem MCP Server**: Use Claude Settings → Extensions → Filesystem for improved security and file access control
- **Context7 MCP Server**: Use Claude Settings → Extensions for documentation and context features

### Fixed
- **Template Injection (P0)**: Critical security vulnerability in brain-connection.js where user inputs could execute malicious code in generated markdown files
- **Error Handling**: Standardized error boundaries and structured response patterns across all brain connection functions
- **Resource Leaks**: Improved cleanup of polling timeouts and file watchers in connection detection
- **JSON Parsing**: Enhanced validation prevents crashes from malformed status files

### Improved  
- **Code Quality**: Reduced cyclomatic complexity by extracting helper functions (escapeMarkdown, formatServerList, createSuccessResult)
- **Testing Strategy**: Property-based testing approach with comprehensive edge case coverage
- **Token Validation**: Enhanced security patterns for deprecated server configurations
- **Confirmation Flows**: User must explicitly confirm before proceeding with deprecated options
- **Migration Safety**: Existing configurations preserved while guiding toward better alternatives

### Why These Changes?

**Enhanced User Experience:**
- **Native Integration**: Claude's built-in connectors provide superior performance and capabilities
- **Simplified Setup**: Fewer external dependencies to manage and configure
- **Better Security**: Native extensions offer improved access control and security models
- **Future-Proof**: Migration path ensures compatibility with Claude's evolving feature set

**Graceful Transition Strategy:**
- **No Breaking Changes**: Existing users retain functionality while being informed of better options
- **Clear Guidance**: Step-by-step migration instructions with specific Claude Settings paths
- **Progressive Adoption**: Users can migrate at their own pace without forced upgrades

**Technical Benefits:**
- **Reduced Complexity**: Fewer MCP servers to maintain and troubleshoot
- **Better Performance**: Native connectors eliminate external process overhead
- **Improved Reliability**: Built-in features are more stable and actively maintained by Anthropic

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