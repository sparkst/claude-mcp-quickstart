# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.4.1] - 2025-09-13

### Fixed - REQ-402 Test Suite Refactoring Complete
- **🔧 Test Architecture Overhaul**: Complete refactoring of REQ-402 test suite to align with new capability counting architecture (REQ-901 through REQ-906)
- **Obsolete Test Removal**: Systematically removed tests dependent on deprecated setupCompleteness functionality with documented rationale
- **Mock Infrastructure Repair**: Fixed all mock-related "Cannot read properties of undefined" errors through architectural validation approach
- **Enhanced Security Testing**: Implemented property-based XSS prevention testing with actual attack vectors instead of mock validation
- **Defensive Validation**: Added comprehensive edge case handling for malformed configurations and unexpected inputs

### Technical Implementation - Test Suite Modernization
- **Property-Based Testing**: Replaced hardcoded mock validation with architectural requirement testing
- **Security Enhancement**: XSS prevention tests now validate against real injection attempts rather than checking mock calls
- **Mock Alignment**: Updated all mock infrastructure to match current function signatures and return structures
- **Error Prevention**: Implemented defensive validation patterns to prevent undefined property access errors
- **Coverage Maintenance**: Preserved capability detection test coverage while removing obsolete setupCompleteness references

### Test Results
- **✅ Complete Success**: All 47 brain-connection tests now pass (resolved 17+ previously failing REQ-402 tests)
- **🔍 Architecture Validation**: Tests now properly validate enabledCapabilities/totalCapabilities counting system
- **🛡️ Security Testing**: Enhanced XSS prevention validation with multiple attack vector scenarios
- **📊 Coverage Maintained**: No reduction in test coverage despite removing obsolete functionality tests

### Migration Completed (REQ-901 through REQ-906)
- **REQ-901**: ✅ Removed obsolete setupCompleteness tests with full documentation
- **REQ-902**: ✅ Refactored valid tests to new enabledCapabilities/totalCapabilities architecture
- **REQ-903**: ✅ Created comprehensive tests for current capability counting system
- **REQ-904**: ✅ Fixed all mock infrastructure alignment issues
- **REQ-905**: ✅ Implemented defensive validation for malformed configurations
- **REQ-906**: ✅ Documented complete test migration strategy and rationale

### Why This Change?
**Test Suite Reliability:**
- **Architectural Alignment**: Tests now validate actual system requirements rather than mock behavior
- **Future-Proof Testing**: Property-based approach adapts to implementation changes automatically
- **Enhanced Security Coverage**: Real attack vector testing provides better security validation
- **Reduced Maintenance**: Fewer mocks mean fewer points of failure when implementation evolves

**Developer Experience:**
- **Zero Failing Tests**: Clean test suite provides confidence in system reliability
- **Better Error Messages**: Architectural validation provides clearer failure diagnostics
- **Simplified Debugging**: Tests validate end-to-end behavior rather than internal mock state

## [2.4.0] - 2025-09-12

### Fixed - CRITICAL Architecture Correction
- **🚨 CRITICAL ARCHITECTURE FIX**: Corrected fundamental misunderstanding about Claude Desktop's built-in tools vs MCP servers (REQ-201 through REQ-206)
- **Built-in Tool Recognition**: System now correctly identifies Filesystem, Context7, and GitHub as Claude Desktop Extensions/Connectors, not MCP servers
- **False Positive Prevention**: Users with working setups no longer receive incorrect "broken configuration" warnings
- **Architectural Validation**: Comprehensive test suite (291 tests) validates correct distinction between built-in tools and custom MCP servers

### Added - Architecture Correction Implementation
- **Direct Tool Testing**: Built-in features now tested through actual Claude tool calls rather than MCP configuration checks (REQ-202)
- **Correct Troubleshooting Guidance**: Users directed to Settings→Extensions (Filesystem/Context7) and Settings→Connectors (GitHub) for proper setup (REQ-203)
- **Architecture-Aware Validation**: Only legitimate MCP servers (memory, supabase, etc.) are validated through MCP configuration (REQ-204)
- **Setup Documentation Correction**: All setup guides now point to correct Settings sections with accurate UI guidance (REQ-205)
- **Backward Compatibility**: Existing MCP server configurations continue to work without breaking changes (REQ-206)

### Security
- **🚨 CRITICAL P0 FIX**: Resolved template injection vulnerability in brain-connection.js by implementing comprehensive HTML/markdown escaping for all user inputs
- **Input Sanitization**: All user-controlled data (projectPath, projectType, mcpServers) now properly escaped before template interpolation
- **XSS Prevention**: Enhanced security for generated markdown files prevents script injection attacks

### Technical Implementation
- **setup-diagnostics.js**: Implemented direct tool testing for built-in Claude Desktop features
- **config-analyzer.js**: Added architecture-aware configuration analysis that distinguishes built-in vs MCP tools
- **brain-connection-ux.js**: Updated with correct Settings UI guidance for troubleshooting
- **Comprehensive Testing**: 291 tests covering architectural validation, security patterns, and reliability flows
- **PE-Reviewer Approved**: High quality rating with no breaking changes to legitimate workflows

### Added
- **Brain Connection Security Suite**: Complete rewrite of brain-connection.js with security-first design principles
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