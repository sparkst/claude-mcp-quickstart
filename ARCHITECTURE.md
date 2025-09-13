# Claude Desktop Architecture Guide

## Purpose
Reference guide for understanding Claude Desktop's tool architecture to prevent future architectural misunderstandings.

## Critical Distinction: Built-in vs MCP Servers

### Built-in Claude Desktop Features
These are **NOT** MCP servers. They are native features managed through Claude Desktop's Settings UI.

**Extensions** (Settings → Extensions):
- **Filesystem**: File access and operations
- **Context7**: Documentation and library lookup
- **Other extensions**: Various productivity tools

**Connectors** (Settings → Connectors):
- **GitHub**: Repository access and operations
- **Cloudflare**: Cloud service integration
- **Other connectors**: Third-party service integrations

**Key Characteristics:**
- ✅ No `claude_desktop_config.json` configuration needed
- ✅ Managed through Settings UI
- ✅ Direct integration with Claude Desktop
- ✅ Test through actual Claude tool calls
- ❌ NOT validated through MCP configuration

### Custom MCP Servers
These ARE actual MCP servers that require configuration file management.

**Current MCP Servers:**
- **memory**: Conversation persistence
- **supabase**: Database operations  
- **brave**: Web search
- **tavily**: AI-optimized search

**Key Characteristics:**
- ✅ Require `claude_desktop_config.json` configuration
- ✅ Run as separate processes
- ✅ Validated through MCP protocol
- ✅ Require server commands and arguments
- ❌ NOT managed through Settings UI

## Validation Strategy

### Built-in Tools Validation
```javascript
// CORRECT: Test through direct tool calls
async function testFilesystem() {
  try {
    await fs.access('/some/path');
    return { available: true, method: 'direct_tool_test' };
  } catch (error) {
    return { available: false, method: 'direct_tool_test', error };
  }
}
```

### MCP Server Validation  
```javascript
// CORRECT: Test through MCP configuration and server responses
async function testMcpServer(serverName) {
  const config = parseClaudeDesktopConfig();
  const server = config.mcpServers?.[serverName];
  if (!server) {
    return { available: false, method: 'mcp_config_check' };
  }
  // Additional server connectivity tests...
}
```

## Troubleshooting Guidance

### Built-in Features
- **Direct users to Settings UI**
- **Provide specific Settings paths**
- **Do NOT mention MCP configuration**

Examples:
- Filesystem issues → "Settings → Extensions → Filesystem"
- GitHub issues → "Settings → Connectors → GitHub"

### MCP Servers
- **Check MCP configuration file**
- **Verify server processes are running** 
- **Test server connectivity**
- **Review server logs**

## Common Mistakes to Avoid

### ❌ Wrong Approaches
```javascript
// DON'T: Check MCP config for built-in tools
const filesystemServer = config.mcpServers?.filesystem; // WRONG

// DON'T: Provide MCP troubleshooting for built-ins
"Check claude_desktop_config.json for filesystem setup"; // WRONG

// DON'T: Test MCP servers through direct calls only
const result = await callTool('memory'); // INSUFFICIENT
```

### ✅ Correct Approaches  
```javascript
// DO: Test built-ins directly
const filesystemAvailable = await testFilesystemAccess(); // CORRECT

// DO: Provide Settings UI guidance for built-ins
"Go to Settings → Extensions → Filesystem"; // CORRECT

// DO: Test MCP servers through configuration + connectivity
const mcpServer = await validateMcpServer('memory'); // CORRECT
```

## REQ-201 through REQ-206 Implementation

This architecture understanding was formalized through comprehensive requirements:

- **REQ-201**: Correct architectural distinction
- **REQ-202**: Direct tool testing for built-ins
- **REQ-203**: Proper troubleshooting guidance
- **REQ-204**: MCP-only validation for actual servers  
- **REQ-205**: Updated documentation
- **REQ-206**: Backward compatibility

See `requirements/requirements.lock.md` for complete acceptance criteria.

## Testing Architecture Understanding

The test suite includes comprehensive architectural validation:

```javascript
describe('Architecture Understanding', () => {
  test('distinguishes built-in vs MCP server tools', () => {
    expect(isBuiltInTool('filesystem')).toBe(true);
    expect(isBuiltInTool('memory')).toBe(false);
  });
  
  test('provides correct troubleshooting guidance', () => {
    const guidance = getTroubleshootingSteps('filesystem');
    expect(guidance.actions).toContain('Settings → Extensions');
    expect(guidance.actions).not.toContain('MCP server');
  });
});
```

All 291 tests validate this architectural understanding to prevent future regressions.