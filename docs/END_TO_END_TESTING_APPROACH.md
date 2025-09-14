# End-to-End Testing Approach

> **Purpose**: Document the comprehensive testing strategy developed for claude-mcp-quickstart to enable replication in similar projects.

## Overview

This project implements a **multi-layered testing approach** that ensures reliability across all platforms and use cases. The strategy emphasizes real-world scenarios, cross-platform compatibility, and comprehensive validation of the entire user workflow.

## Testing Architecture

### 1. Test Framework Stack
- **Primary Framework**: Vitest (fast, modern, ESM-native)
- **Assertion Library**: Built-in Vitest assertions
- **Test Runner**: Vitest with custom configuration
- **Cross-Platform Support**: Custom Vite plugin for Windows compatibility

### 2. Test Categories

#### **Unit Tests (*.spec.js)**
- **Location**: Co-located with source files
- **Purpose**: Test individual functions and modules
- **Coverage**: 95 tests across 8 test files
- **Focus Areas**:
  - Configuration parsing and validation
  - Template processing and file operations
  - Error handling and edge cases
  - Platform-specific functionality

#### **Integration Tests (e2e.spec.js)**
- **Purpose**: Test complete workflows end-to-end
- **Scenarios**:
  - Full setup workflow simulation
  - File system interactions
  - CLI command execution
  - Configuration file generation

#### **Platform Compatibility Tests (platform.spec.js)**
- **Purpose**: Ensure cross-platform functionality
- **Coverage**:
  - Path handling differences (Windows vs Unix)
  - File permission variations
  - Shell script compatibility

#### **Template System Tests (template.spec.js)**
- **Purpose**: Validate template processing pipeline
- **Coverage**:
  - Template file loading
  - Variable substitution
  - Path resolution across platforms

## Key Testing Patterns

### 1. Real Environment Testing
```javascript
// Pattern: Test with actual file system operations
const tempDir = await mkdtemp(path.join(tmpdir(), 'test-'));
const result = await setupWorkspace(tempDir);
expect(result.configPath).toMatch(/claude_desktop_config\.json$/);
```

### 2. Cross-Platform Path Handling
```javascript
// Pattern: Use filename checks instead of full paths
expect(path.basename(result.file)).toBe('expected-file.json');
// Avoid: expect(result.file).toBe('/full/path/file.json');
```

### 3. Template Path Resolution Testing
```javascript
// Pattern: Test package-relative path resolution
const template = readTemplate('ai-activation.md');
expect(template).toContain('# AI Activation Guide');
```

### 4. Error Boundary Testing
```javascript
// Pattern: Test graceful error handling
const result = await processInvalidConfig();
expect(result.success).toBe(false);
expect(result.error).toMatch(/Invalid configuration/);
```

## Custom Test Infrastructure

### Windows Compatibility Plugin (vitest.config.js)
```javascript
// Handles shebang lines that break Windows testing
export function removeShebang(code) {
  if (code.startsWith("#!")) {
    return code.replace(/^#!.*\r?\n?/, "");
  }
  return code;
}

export default defineConfig({
  plugins: [
    {
      name: "remove-shebang",
      transform(code, id) {
        if (id && !id.endsWith('.js')) {
          return code;
        }
        return removeShebang(code);
      },
    },
  ],
});
```

### Test Utilities (test-utils.js)
- **Temporary directory management**
- **File system mocking helpers**
- **Configuration generation utilities**
- **Cross-platform path normalization**

## Test Execution Strategy

### 1. Local Development
```bash
npm test              # Watch mode for development
npm run test:run      # Single run for CI/verification
```

### 2. CI/CD Integration
- **Matrix Testing**: Multiple OS (Ubuntu, macOS, Windows) × Node versions (18, 20)
- **Comprehensive Coverage**: All test categories run on each platform
- **Quality Gates**: Tests must pass before any deployment

### 3. Global Package Testing
```bash
# Real-world installation testing
npm pack
npm install -g ./package-*.tgz
package-name --version  # Verify CLI functionality
```

## Testing Best Practices Established

### 1. Test Isolation
- Each test creates its own temporary directory
- No shared state between tests
- Clean setup/teardown for all resources

### 2. Realistic Scenarios
- Test actual file system operations (not just mocks)
- Use real temporary directories and files
- Validate complete user workflows

### 3. Cross-Platform Awareness
- Never hardcode platform-specific paths
- Test path resolution on all platforms
- Handle different line endings and file permissions

### 4. Error Case Coverage
- Test invalid inputs and edge cases
- Verify graceful degradation
- Ensure meaningful error messages

### 5. Performance Considerations
- Tests complete in <500ms total
- Parallel execution where possible
- Efficient temporary resource cleanup

## Common Testing Patterns

### Configuration Testing
```javascript
describe('configuration handling', () => {
  test('loads valid config', async () => {
    const config = await loadConfig(validConfigPath);
    expect(config.version).toBeDefined();
  });
  
  test('handles invalid JSON gracefully', async () => {
    const result = await loadConfig(invalidConfigPath);
    expect(result.error).toMatch(/Invalid JSON/);
  });
});
```

### File System Testing
```javascript
describe('file operations', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'test-'));
  });
  
  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });
  
  test('creates files in correct locations', async () => {
    const result = await createWorkspaceFiles(tempDir);
    expect(result.files).toHaveLength(3);
  });
});
```

### CLI Testing
```javascript
describe('CLI functionality', () => {
  test('displays version information', async () => {
    const result = await runCLI(['--version']);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    expect(result.exitCode).toBe(0);
  });
});
```

## Quality Metrics

- **Test Count**: 95 comprehensive tests
- **Coverage Areas**: Core functionality, edge cases, platform compatibility
- **Execution Time**: <500ms for full suite
- **Platform Coverage**: Windows, macOS, Linux
- **Node Version Coverage**: 18.x, 20.x

## Migration Guidelines

When applying this approach to new projects:

1. **Copy test infrastructure**: vitest.config.js, test-utils.js patterns
2. **Establish test categories**: Unit, integration, platform, template
3. **Implement cross-platform patterns**: Path handling, shebang removal
4. **Set up CI matrix**: Multiple OS and Node versions
5. **Add real-world testing**: Global package installation, CLI verification
6. **Focus on user workflows**: Test complete scenarios, not just functions

This testing approach ensures **production-ready reliability** across all platforms and use cases while maintaining fast development cycles and comprehensive error detection.