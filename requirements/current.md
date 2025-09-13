# Current Requirements

## REQ-201: Correct Claude Desktop Architecture Understanding
- Acceptance: Validation logic correctly identifies built-in vs MCP server tools
- Acceptance: Filesystem, Context7, and Github are treated as built-in Extensions/Connectors
- Acceptance: Only custom MCP servers (memory, supabase, etc.) are validated through MCP configuration
- Non-Goals: Validating built-in Claude Desktop features through MCP server checks
- Notes: Filesystem/Context7 are Settings->Extensions, Github is Settings->Connectors

## REQ-202: Direct Tool Testing for Built-in Features
- Acceptance: Test Filesystem access by attempting file operations
- Acceptance: Test Context7 by attempting library documentation lookup
- Acceptance: Test Github by attempting repository operations
- Acceptance: All tests use actual Claude tool calls, not MCP configuration checks
- Non-Goals: Checking MCP server configuration for built-in tools
- Notes: These tools are available if Claude Desktop has proper permissions

## REQ-203: Correct Troubleshooting Guidance
- Acceptance: Users directed to Settings->Extensions for Filesystem/Context7 issues
- Acceptance: Users directed to Settings->Connectors for Github issues
- Acceptance: MCP troubleshooting only applies to custom servers
- Acceptance: Clear distinction between built-in and MCP server features
- Non-Goals: MCP-based troubleshooting for built-in features
- Notes: Many users likely have working setups being flagged as broken

## REQ-204: Revised MCP Server Validation
- Acceptance: Only validate actual MCP servers (memory, supabase, etc.)
- Acceptance: Skip MCP validation for Filesystem, Context7, Github entirely
- Acceptance: Maintain existing MCP validation logic for legitimate MCP servers
- Non-Goals: Validating built-in Claude features as MCP servers
- Notes: Preserve working validation for actual MCP servers

## REQ-205: Updated Setup Documentation
- Acceptance: Setup guides point to correct Settings sections
- Acceptance: Clear explanation of built-in vs MCP server distinction
- Acceptance: Troubleshooting steps match actual Claude Desktop UI
- Acceptance: Remove incorrect MCP configuration advice for built-in tools
- Non-Goals: Maintaining incorrect architectural assumptions
- Notes: Documentation should match reality of Claude Desktop

## REQ-206: Backward Compatibility
- Acceptance: Existing MCP server configurations continue to work
- Acceptance: No breaking changes to legitimate MCP server validation
- Acceptance: Graceful handling of existing incorrect configurations
- Non-Goals: Supporting invalid MCP configurations for built-in tools
- Notes: Transition should be smooth for users with working setups