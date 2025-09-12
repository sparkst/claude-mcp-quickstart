# Brain Connection API Documentation

## Purpose
Comprehensive API reference for the secure brain-connection module that orchestrates Claude integration with MCP workspaces.

## Core Functions

### `initiateBrainConnection(projectPath, mcpServers, projectType)`
Main orchestration function for Claude brain connection flow.

**Parameters:**
- `projectPath` (string): Absolute path to project directory  
- `mcpServers` (string[]): Array of configured MCP server names
- `projectType` (string, optional): Project type identifier (default: "Node.js")

**Returns:** `Promise<ConnectionResult>`
```typescript
interface ConnectionResult {
  success: boolean;
  status?: ConnectionStatus;     // On success
  reason: string;               // "connected" | "timeout" | "error"  
  timestamp: string;           // ISO 8601 timestamp
  error?: string;              // Error message on failure
  timeoutInfo?: TimeoutInfo;   // Timeout details on timeout
  metadata: {
    projectPath: string;
    projectType: string;
    serversConfigured?: number;
    timeoutDuration?: number;
    fallbackProvided?: boolean;
  };
}
```

**Example Usage:**
```javascript
const result = await initiateBrainConnection(
  "/path/to/project", 
  ["memory", "supabase"], 
  "Next.js"
);

if (result.success) {
  console.log("Claude connected:", result.status.next_steps);
} else {
  console.log("Connection failed:", result.reason);
}
```

### `createBrainConnectionFile(projectPath, mcpServers, projectType)`
Creates secure connection prompt file with escaped content.

**Security Features:**
- All user inputs sanitized via `escapeMarkdown()`
- Template injection prevention
- Safe markdown generation

**Parameters:**
- `projectPath` (string): Project directory path
- `mcpServers` (string[]): MCP server configuration  
- `projectType` (string, optional): Project type (default: "Node.js")

**Returns:** `Promise<string>` - Path to created file

**Generated File:** `connect_claude_brain.md`
- Contains escaped workspace context
- Includes MCP server configuration
- Provides connection instructions for Claude

### `waitForClaudeConnection(projectPath, timeoutMs)`
Polls for Claude connection status with exponential backoff.

**Parameters:**
- `projectPath` (string): Project directory to monitor
- `timeoutMs` (number, optional): Timeout duration (default: 300000ms = 5 minutes)

**Returns:** `Promise<ConnectionStatus>`
```typescript
interface ConnectionStatus {
  status: string;                    // Required: "connected"
  timestamp: string;                 // Required: ISO 8601 timestamp
  mcp_servers_verified?: string[];   // Optional: Verified server list
  workspace_loaded?: boolean;        // Optional: Workspace status
  next_steps?: string;              // Optional: Instructions
}
```

**Monitoring Behavior:**
- Exponential backoff: starts at 100ms, max 2000ms
- Validates JSON structure and required fields
- Proper resource cleanup on completion/timeout
- Watches for `claude_brain_connected.json` file

### `displayBrainConnectionPrompt(filePath)`
Shows user-friendly connection prompt with consistent UX patterns.

**Parameters:**
- `filePath` (string): Path to connection file

**Output Features:**
- Follows existing chalk color patterns
- Consistent visual hierarchy
- Clear next-step instructions
- Matches setup.js UX conventions

### `handleConnectionTimeout(projectPath)`
Graceful timeout handling with structured fallback.

**Parameters:**
- `projectPath` (string): Project directory path

**Returns:** `TimeoutInfo`
```typescript
interface TimeoutInfo {
  reason: "timeout";
  timestamp: string;
  fallbackProvided: boolean;
  guidance: string[];
  files: {
    connectionPrompt: string;
    expectedStatusFile: string;
  };
}
```

**Fallback Behavior:**
- Provides clear user guidance
- Preserves connection prompt file
- Enables later manual connection
- Maintains positive UX messaging

### `displayConnectionSuccess(status)`
Displays success confirmation with status validation.

**Parameters:**
- `status` (ConnectionStatus): Validated status object

**Validation:**
- Checks object structure
- Handles missing optional fields gracefully
- Prevents display of "undefined" values
- Provides rich success feedback

## Helper Functions

### `escapeMarkdown(text)`
Core security function for input sanitization.

**Security Escaping Rules:**
```javascript
& → &amp;      // HTML entities
< → &lt;       // Script tags  
> → &gt;       // Script tags
" → &quot;     // Attribute injection
' → &#x27;     // Attribute injection
/ → &#x2F;     // Path traversal
\ → &#x5C;     // Path traversal
```

**Parameters:**
- `text` (any): Input to escape (converted to string)

**Returns:** `string` - Safely escaped content

### `formatServerList(mcpServers)`
Safely formats server arrays for JSON context.

**Parameters:**
- `mcpServers` (string[]): Array of server names

**Returns:** `string` - Quoted, comma-separated server list

**Validation:**
- Filters non-string entries
- Trims whitespace
- Applies escapeMarkdown to each server name
- Provides fallback: `"memory", "supabase"`

## Error Handling

### Structured Error Interface
All functions return consistent error structures:
```javascript
{
  success: false,
  reason: "error" | "timeout",
  timestamp: string,
  error?: string,
  metadata: {
    projectPath: string,
    projectType: string,
    phase: string
  }
}
```

### Error Boundaries
- All exceptions caught and converted to structured responses
- No unhandled promise rejections
- Process crash prevention
- Consistent API contract maintained

### Resource Management
- Timeout cleanup with `clearTimeout()`
- Exponential backoff prevents resource exhaustion
- File handle cleanup in watchers
- Memory leak prevention

## Integration Examples

### Basic Integration
```javascript
import { initiateBrainConnection } from './brain-connection.js';

async function setupWorkspace() {
  const result = await initiateBrainConnection(
    process.cwd(),
    ['memory', 'filesystem'],
    'React'
  );
  
  return result.success;
}
```

### Error Handling Pattern
```javascript
try {
  const result = await initiateBrainConnection(projectPath, servers);
  
  switch (result.reason) {
    case 'connected':
      handleSuccess(result.status);
      break;
    case 'timeout':
      handleTimeout(result.timeoutInfo);
      break;
    case 'error':
      handleError(result.error);
      break;
  }
} catch (error) {
  // Should not reach here due to error boundaries
  console.error('Unexpected error:', error);
}
```

### Custom Timeout Handling
```javascript
const result = await waitForClaudeConnection(projectPath, 60000); // 1 minute
```

## Best Practices

### Security
- Always validate user inputs before passing to API functions
- Never bypass escapeMarkdown() for user-controlled data
- Monitor generated files for unexpected content
- Implement additional input length validation as needed

### Reliability
- Use structured error handling patterns
- Implement retry logic for transient failures
- Monitor resource usage in polling operations
- Set appropriate timeout values for user experience

### Testing
- Test injection prevention with malicious inputs
- Validate error boundary coverage
- Verify resource cleanup in all code paths
- Property-based testing for algorithmic functions

---

**API Version**: 1.0 (Security Hardened)
**Last Updated**: 2025-09-11
**Breaking Changes**: None (backward compatible)