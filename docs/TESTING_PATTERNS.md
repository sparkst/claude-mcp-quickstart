# Testing Patterns Reference

## Quick Reference for REQ-402 Refactored Test Architecture

This document provides quick reference patterns for the modern testing approach established during the REQ-402 refactoring.

## Core Testing Patterns

### 1. Architectural Validation Pattern
**Use for**: Testing system requirements and behavior
```javascript
// ✅ Good - Tests actual system requirements
describe('capability counting system', () => {
  test('REQ-903 — returns correct enabled capabilities count', async () => {
    const result = await generateEnhancedPromptContent(mockConfig);

    expect(result.enabledCapabilities).toBe(2);
    expect(result.totalCapabilities).toBe(10);
    expect(result.mcpCapabilities).toHaveLength(10);
    expect(result.mcpCapabilities.filter(cap => cap.enabled)).toHaveLength(2);
  });
});

// ❌ Avoid - Mock-dependent testing
test('calls generateMcpCapabilities correctly', () => {
  expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
});
```

### 2. Property-Based Security Testing
**Use for**: XSS prevention and security validation
```javascript
// ✅ Good - Tests against real attack vectors
describe('XSS prevention', () => {
  test('REQ-905 — prevents script injection in project paths', async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '![img](x onerror=alert(1))',
      '[text](javascript:alert(1))',
      '`<img src=x onerror=alert(1)>`'
    ];

    maliciousInputs.forEach(input => {
      const result = createBrainConnectionFile(`/path/${input}`, 'react');

      expect(result).not.toContain('<script');
      expect(result).not.toContain('onerror=');
      expect(result).not.toContain('javascript:');
    });
  });
});

// ❌ Avoid - Mock validation only
test('calls escapeMarkdown function', () => {
  expect(escapeMarkdown).toHaveBeenCalled();
});
```

### 3. Defensive Validation Pattern
**Use for**: Edge cases and malformed input handling
```javascript
// ✅ Good - Tests system resilience
describe('defensive validation', () => {
  test('REQ-905 — handles malformed server configurations gracefully', async () => {
    const malformedConfigs = [
      { mcpServers: null },
      { mcpServers: undefined },
      { mcpServers: "not-an-object" },
      { mcpServers: [] },
      {}
    ];

    malformedConfigs.forEach(config => {
      const result = generateEnhancedPromptContent(config);

      expect(result.enabledCapabilities).toBe(0);
      expect(result.totalCapabilities).toBe(10);
      expect(() => result.mcpCapabilities.length).not.toThrow();
    });
  });
});
```

### 4. Error Boundary Testing
**Use for**: Testing error handling and recovery
```javascript
// ✅ Good - Tests error boundaries
describe('error handling', () => {
  test('REQ-905 — gracefully handles JSON parsing errors', async () => {
    const invalidJson = "{ invalid json content }";

    // Should not throw, should provide fallback behavior
    expect(() => parseStatusFile(invalidJson)).not.toThrow();

    const result = parseStatusFile(invalidJson);
    expect(result).toEqual({ success: false, error: expect.any(String) });
  });
});
```

## Test Organization Patterns

### Requirement-Based Test Structure
```javascript
describe('REQ-903: Current Capability Counting System', () => {
  test('REQ-903 — counts enabled capabilities accurately', () => {
    // Test implementation
  });

  test('REQ-903 — maintains total capability count of 10', () => {
    // Test implementation
  });

  test('REQ-903 — handles various MCP server configurations', () => {
    // Test implementation
  });
});
```

### Security Test Organization
```javascript
describe('Security Validation', () => {
  describe('XSS Prevention', () => {
    test('REQ-905 — prevents script injection in paths', () => {
      // Test malicious path inputs
    });

    test('REQ-905 — prevents markdown injection in descriptions', () => {
      // Test malicious markdown inputs
    });
  });

  describe('Input Sanitization', () => {
    test('REQ-905 — sanitizes user project names', () => {
      // Test project name sanitization
    });
  });
});
```

## Mock Usage Guidelines

### When to Use Mocks
- **File system operations** that would create actual files
- **Network requests** to external services
- **Time-dependent operations** for consistent testing

### When to Avoid Mocks
- **Business logic validation** - test the actual requirements
- **Security testing** - use real attack vectors
- **Data transformation** - test actual input/output behavior

### Good Mock Example
```javascript
// ✅ Good - Mock external dependencies only
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{"success": true}')
}));
```

### Avoid Mock Example
```javascript
// ❌ Avoid - Don't mock business logic
vi.mock('./brain-connection-ux.js', () => ({
  generateEnhancedPromptContent: vi.fn().mockReturnValue({
    // This creates fragile tests dependent on mock structure
  })
}));
```

## Migration Checklist

When updating tests to follow these patterns:

### 1. Identify Test Intent
- [ ] What requirement does this test validate?
- [ ] Is this testing system behavior or mock behavior?
- [ ] Can this be tested without mocks?

### 2. Apply Appropriate Pattern
- [ ] Use architectural validation for system requirements
- [ ] Use property-based testing for security validation
- [ ] Use defensive validation for edge cases
- [ ] Include error boundary testing where appropriate

### 3. Validate Test Quality
- [ ] Test can fail for real defects
- [ ] Test description matches what is being validated
- [ ] Test uses strong assertions (toEqual vs toBeGreaterThan)
- [ ] Test includes edge cases and malformed inputs

### 4. Documentation
- [ ] Test title includes requirement ID (REQ-XXX)
- [ ] Test intent is clear from description
- [ ] Complex test logic is commented
- [ ] Mock usage is justified and documented

## Benefits of This Approach

### Reliability
- Tests validate actual system behavior
- Less brittle than mock-dependent tests
- Catches real defects in system logic

### Security
- Real attack vector testing provides genuine protection
- Property-based approach covers more attack scenarios
- Defensive validation prevents runtime errors

### Maintainability
- Fewer mocks reduce test maintenance overhead
- Tests adapt to implementation changes automatically
- Clear requirement mapping aids debugging

### Developer Experience
- Tests provide better failure diagnostics
- Implementation can be refactored safely
- Test intent is immediately obvious

This testing approach, established during the REQ-402 refactoring, provides a robust foundation for reliable, secure, and maintainable test development.