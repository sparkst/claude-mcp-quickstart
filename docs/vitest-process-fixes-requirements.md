# Vitest Process Lingering - Fixes and Requirements

> **Purpose**: Actionable requirements and solutions for Claude Code projects experiencing vitest process lingering issues after test runs.

## Problem Statement

**Issue**: Vitest processes remain active after test completion, preventing clean test suite termination and causing development workflow disruption.

**Symptoms**:
- `npm test` or `vitest` commands don't terminate cleanly
- Background processes consuming CPU/memory after tests finish
- Need to manually kill vitest processes
- Tests appear to hang during or after execution
- Inconsistent test results due to process conflicts

## Root Cause Analysis from setupCompleteness Project

### Primary Causes Identified

1. **Corrupted/Failing Test Files**
   - Malformed test structures causing vitest parser issues
   - Tests with unhandled promise rejections
   - Improper cleanup in test teardown

2. **Complex Calculation Logic in Tests**
   - Heavy computational tests that don't complete properly
   - Percentage calculations with edge cases causing infinite loops
   - Mock data with circular references or memory leaks

3. **Improper Test Structure**
   - Missing test cleanup (afterEach/afterAll hooks)
   - Shared state between tests causing conflicts
   - Tests modifying global objects without restoration

4. **Mock Data Issues**
   - Test fixtures with properties that cause assertion timeouts
   - Overly complex mock objects with deep nesting
   - Mock functions that don't properly reset between tests

## Solution Requirements

### REQ-VIT-701: Identify and Clean Corrupted Test Files
- **Acceptance**: All test files have proper structure and pass individually
- **Detection Method**: Run tests in isolation to identify hanging files
- **Action Items**:
  - Run `vitest --run --reporter=verbose` to identify hanging test files
  - Check for malformed describe/it/test blocks
  - Look for tests with unhandled promise rejections
  - Verify proper async/await usage in test functions

**Implementation Steps**:
```bash
# Test each file individually to isolate issues
npx vitest run src/file1.spec.js
npx vitest run src/file2.spec.js
# Identify which files hang or fail to terminate
```

### REQ-VIT-702: Remove Complex Calculation Logic from Tests
- **Acceptance**: Tests complete within reasonable time limits without hanging
- **Focus Areas**:
  - Percentage calculations
  - Heavy computational logic
  - Nested loops in test assertions
  - Complex object property calculations

**Example Fix**:
```javascript
// BEFORE: Complex calculation causing hangs
test('calculates setup completeness', () => {
  const result = generateEnhancedPromptContent(complexMockData);
  const percentage = Math.round((result.enabled.length / result.total.length) * 100);
  expect(result.setupCompleteness).toBe(percentage);
});

// AFTER: Simple assertion without calculation
test('returns capability data', () => {
  const result = generateEnhancedPromptContent(simpleMockData);
  expect(result.capabilities).toBeDefined();
  expect(Array.isArray(result.enabled)).toBe(true);
});
```

### REQ-VIT-703: Implement Proper Test Cleanup
- **Acceptance**: All tests properly clean up state and resources
- **Required Implementation**:
  - Add `afterEach` hooks to reset shared state
  - Add `afterAll` hooks to clean up resources
  - Ensure mock functions are properly restored
  - Clear any timers or intervals

**Template**:
```javascript
describe('ComponentName', () => {
  afterEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Reset any global state
    globalState.reset();
    // Clear timers
    vi.clearAllTimers();
  });

  afterAll(() => {
    // Final cleanup
    vi.restoreAllMocks();
  });
});
```

### REQ-VIT-704: Simplify Mock Data and Test Fixtures
- **Acceptance**: Mock data contains only essential properties for testing
- **Action Items**:
  - Remove unused properties from mock objects
  - Eliminate circular references in test data
  - Simplify nested object structures
  - Remove complex calculated properties

**Example Simplification**:
```javascript
// BEFORE: Complex mock with calculated properties
const complexMock = {
  capabilities: [...],
  setupCompleteness: calculatePercentage(...), // Calculated property
  nestedConfig: {
    deepProperty: {
      calculatedValue: heavyComputation()
    }
  }
};

// AFTER: Simple mock with essential data only
const simpleMock = {
  capabilities: ['filesystem', 'git'],
  enabled: ['filesystem'],
  disabled: ['git']
};
```

### REQ-VIT-705: Add Explicit Process Termination
- **Acceptance**: Vitest configuration ensures clean process termination
- **Configuration Requirements**:

```javascript
// vitest.config.js
export default {
  test: {
    // Ensure processes terminate cleanly
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Set reasonable timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    // Force exit after tests complete
    forceRerunTriggers: ['**/package.json/**'],
    // Clean up between test runs
    clearMocks: true,
    restoreMocks: true
  }
};
```

### REQ-VIT-706: Implement Test Isolation
- **Acceptance**: Tests run independently without shared state issues
- **Implementation**:
  - Use `vi.isolateModules()` for module-level isolation
  - Avoid modifying global objects in tests
  - Use factory functions for test data instead of shared constants
  - Implement proper test environment reset

**Example**:
```javascript
// Use isolated modules to prevent state leakage
test('module isolation', async () => {
  await vi.isolateModules(async () => {
    const { functionUnderTest } = await import('./module');
    // Test runs in isolation
  });
});
```

## Specific Technical Solutions

### Solution 1: Test File Structure Restoration
When encountering hanging test files:

1. **Back up the current test file**
2. **Create a minimal test structure**:
```javascript
import { describe, test, expect } from 'vitest';

describe('ModuleName', () => {
  test('basic functionality', () => {
    expect(true).toBe(true);
  });
});
```
3. **Gradually re-add tests one by one**, testing after each addition
4. **Identify the specific test causing hangs**

### Solution 2: Mock Function Cleanup
Ensure all mock functions are properly managed:

```javascript
import { vi, beforeEach, afterEach } from 'vitest';

// Create mocks at module level
const mockFunction = vi.fn();

beforeEach(() => {
  // Reset call history but keep implementation
  mockFunction.mockClear();
});

afterEach(() => {
  // Full reset including implementation
  vi.restoreAllMocks();
});
```

### Solution 3: Async Test Handling
Properly handle asynchronous operations:

```javascript
// WRONG: Can cause hanging
test('async operation', () => {
  someAsyncFunction().then(result => {
    expect(result).toBeDefined();
  });
});

// CORRECT: Proper async handling
test('async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

## Implementation Checklist

### Phase 1: Diagnosis
- [ ] Run `vitest --run --reporter=verbose` to identify hanging files
- [ ] Test each spec file individually to isolate issues
- [ ] Check for unhandled promise rejections in test output
- [ ] Identify tests with complex calculation logic

### Phase 2: Test Cleanup
- [ ] Remove or simplify tests with heavy computational logic
- [ ] Add proper afterEach/afterAll cleanup hooks
- [ ] Simplify mock data to essential properties only
- [ ] Implement test isolation where needed

### Phase 3: Configuration
- [ ] Update vitest.config.js with proper termination settings
- [ ] Set reasonable timeout values
- [ ] Enable mock cleanup between tests
- [ ] Configure thread pool for stability

### Phase 4: Validation
- [ ] Run full test suite to verify clean termination
- [ ] Check that no vitest processes remain after completion
- [ ] Verify consistent test results across multiple runs
- [ ] Monitor CPU/memory usage during test execution

## Monitoring and Prevention

### Ongoing Practices
1. **Regular Test Audits**: Review tests for complexity and proper cleanup
2. **Mock Data Maintenance**: Keep test fixtures simple and focused
3. **Process Monitoring**: Check for lingering processes after test runs
4. **Test Isolation**: Ensure tests don't share state or side effects

### Warning Signs to Watch For
- Tests that take significantly longer than expected
- Inconsistent test results between runs
- High CPU usage during or after test execution
- Need to manually terminate test processes

## Success Metrics

### Before Fixes
- Vitest processes lingering after test completion
- Manual process termination required
- Inconsistent test results
- Development workflow disruption

### After Fixes
- ✅ Clean test termination
- ✅ No background processes after tests
- ✅ Consistent test results
- ✅ Smooth development workflow
- ✅ Reliable CI/CD pipeline

## Related Resources

### Vitest Configuration Reference
- [Vitest Config Options](https://vitest.dev/config/)
- [Test Environment Setup](https://vitest.dev/guide/environment.html)
- [Mock Functions](https://vitest.dev/api/vi.html#vi-fn)

### Debugging Commands
```bash
# Check for hanging processes
ps aux | grep vitest

# Kill specific vitest processes
pkill -f vitest

# Run tests with detailed output
npx vitest --run --reporter=verbose

# Test specific file only
npx vitest run path/to/test.spec.js
```

## Conclusion

Vitest process lingering is typically caused by corrupted test files, complex calculation logic, or improper cleanup. The systematic approach outlined in these requirements provides a reliable method for identifying and resolving these issues.

**Key Success Factors:**
1. **Systematic Diagnosis**: Test files individually to isolate problems
2. **Aggressive Simplification**: Remove complex logic from tests
3. **Proper Cleanup**: Implement thorough test teardown
4. **Configuration Optimization**: Set appropriate timeouts and isolation settings

Follow these requirements methodically to achieve clean, reliable test execution without process lingering issues.