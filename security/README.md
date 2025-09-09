# Token Security Domain

## Purpose
Secure handling of API tokens and sensitive credentials for MCP server configuration. Provides masked display, memory clearing, validation, and safe storage operations.

## Boundaries
**Inside this domain:**
- Token masking and display (`maskToken()`)
- Secure memory handling (`withSecureToken()`, `clearToken()`)  
- Token format validation (`validateToken()`)
- Configuration loading and validation (`loadExistingConfig()`, `validateAndMergeConfig()`)
- User interaction flows for token management

**Outside this domain:**
- Actual MCP server communication
- Network requests using tokens
- Token generation or refresh logic
- Claude Desktop configuration file location

## Key Files
- `../setup.js` - Core token security functions (private)
- `../test-utils.js` - Test-specific token utilities (public for testing)
- `../setup.spec.js` - Comprehensive token security tests (47 tests)

## Common Patterns

### Token Masking Pattern
```javascript
const maskedToken = maskToken(token);  // "abcde********123"
```

### Secure Token Handling Pattern  
```javascript
const result = withSecureToken(token, (t) => {
  return processToken(t);  // Use token safely
}); // Token automatically cleared from memory
```

### Token Validation Pattern
```javascript
if (validateToken(userInput, 'github')) {
  // Token format is valid for GitHub
}
```

### UX Interaction Pattern
```javascript
// Prompt shows: [Current: abcde********123] (Enter to keep, "-" to delete, or paste new)
if (input === "-") {
  // Delete server
} else if (input === "" && existingToken) {
  // Keep existing
} else if (input) {
  // Validate and use new token
}
```

## Dependencies
- `fs/promises` - File system operations
- `inquirer` - User prompts and interactions  
- `chalk` - Console output formatting
- `../setup.js` exports: `getConfigPath()` for config location

## Security Considerations
- Tokens are cleared from memory after use (best effort)
- Regex validation prevents basic injection attacks
- Atomic file writes prevent corruption
- JSON parsing has error recovery
- Test coverage prevents security regressions