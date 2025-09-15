/**
 * Automated Security Testing & Validation Pipeline
 *
 * Implements comprehensive automated security testing, continuous validation,
 * and regression prevention for the CLAUDE.md security system.
 *
 * @module SecurityTestingPipeline
 * @version 1.0.0
 * @since 2025-09-14
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { performance } from 'perf_hooks';
import chalk from 'chalk';
import { getSecurityMonitor } from './security-monitor.js';
import { getSecurityHardening } from './security-hardening.js';
import { getComplianceFramework } from './compliance-framework.js';

/**
 * Test categories for security validation
 */
export const SecurityTestCategory = {
  UNIT: 'UNIT',
  INTEGRATION: 'INTEGRATION',
  PENETRATION: 'PENETRATION',
  COMPLIANCE: 'COMPLIANCE',
  REGRESSION: 'REGRESSION',
  PERFORMANCE: 'PERFORMANCE',
  LOAD: 'LOAD'
};

/**
 * Test severity levels
 */
export const TestSeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
};

/**
 * Test execution status
 */
export const TestStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  ERROR: 'ERROR'
};

/**
 * Automated Security Testing Pipeline
 */
export class SecurityTestingPipeline {
  constructor(options = {}) {
    this.options = {
      testSuites: options.testSuites || ['security', 'compliance', 'penetration'],
      enableContinuousTesting: options.enableContinuousTesting !== false,
      enableRegressionTesting: options.enableRegressionTesting !== false,
      enablePerformanceTesting: options.enablePerformanceTesting !== false,
      testResultsPath: options.testResultsPath || './security/test-results',
      reportPath: options.reportPath || './security/test-reports',
      maxConcurrentTests: options.maxConcurrentTests || 4,
      testTimeout: options.testTimeout || 30000, // 30 seconds
      criticalFailureThreshold: options.criticalFailureThreshold || 0,
      regressionThreshold: options.regressionThreshold || 0.05, // 5%
      ...options
    };

    // Initialize components
    this.monitor = getSecurityMonitor();
    this.hardening = getSecurityHardening();
    this.compliance = getComplianceFramework();

    // Test management
    this.testSuites = new Map();
    this.testResults = new Map();
    this.runningTests = new Set();
    this.testHistory = new Map();

    // Pipeline metrics
    this.metrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      errorTests: 0,
      totalExecutionTime: 0,
      lastRun: null,
      regressions: 0,
      securityIssues: 0
    };

    this.initializePipeline();
  }

  /**
   * Initialize security testing pipeline
   */
  initializePipeline() {
    // Create directories
    this.ensureDirectories();

    // Load test suites
    this.loadTestSuites();

    // Start continuous testing if enabled
    if (this.options.enableContinuousTesting) {
      this.startContinuousTesting();
    }

    console.log(
      chalk.green(`🧪 Security Testing Pipeline Active`),
      `\n${chalk.yellow('Test Suites:')} ${this.testSuites.size}`,
      `\n${chalk.yellow('Continuous Testing:')} ${this.options.enableContinuousTesting ? 'ENABLED' : 'DISABLED'}`,
      `\n${chalk.yellow('Regression Testing:')} ${this.options.enableRegressionTesting ? 'ENABLED' : 'DISABLED'}`,
      `\n${chalk.yellow('Performance Testing:')} ${this.options.enablePerformanceTesting ? 'ENABLED' : 'DISABLED'}`
    );
  }

  /**
   * Load test suites configuration
   */
  loadTestSuites() {
    // CLI Security Test Suite
    this.testSuites.set('cli-security', {
      id: 'cli-security',
      name: 'CLI Security Tests',
      category: SecurityTestCategory.UNIT,
      severity: TestSeverity.CRITICAL,
      description: 'Validates CLI security controls and input sanitization',
      testFile: './cli-security.spec.js',
      requirements: ['REQ-SEC-001', 'REQ-SEC-002', 'REQ-SEC-003', 'REQ-SEC-004', 'REQ-SEC-005'],
      enabled: true,
      timeout: 10000
    });

    // Template Security Test Suite
    this.testSuites.set('template-security', {
      id: 'template-security',
      name: 'Template Security Tests',
      category: SecurityTestCategory.UNIT,
      severity: TestSeverity.HIGH,
      description: 'Validates template injection prevention and escaping',
      testFile: './template-security.spec.js',
      requirements: ['REQ-TPL-001', 'REQ-TPL-002'],
      enabled: true,
      timeout: 5000
    });

    // Token Security Test Suite
    this.testSuites.set('token-security', {
      id: 'token-security',
      name: 'Token Security Tests',
      category: SecurityTestCategory.UNIT,
      severity: TestSeverity.HIGH,
      description: 'Validates secure token handling and memory management',
      testFile: './setup.spec.js',
      requirements: ['REQ-TOK-001', 'REQ-TOK-002', 'REQ-TOK-003'],
      enabled: true,
      timeout: 8000
    });

    // Security Monitor Test Suite
    this.testSuites.set('monitor-security', {
      id: 'monitor-security',
      name: 'Security Monitor Tests',
      category: SecurityTestCategory.INTEGRATION,
      severity: TestSeverity.HIGH,
      description: 'Validates security monitoring and threat detection',
      testFile: './security/security-monitor.spec.js',
      requirements: ['REQ-MON-001', 'REQ-MON-002'],
      enabled: true,
      timeout: 15000
    });

    // Security Hardening Test Suite
    this.testSuites.set('hardening-security', {
      id: 'hardening-security',
      name: 'Security Hardening Tests',
      category: SecurityTestCategory.INTEGRATION,
      severity: TestSeverity.HIGH,
      description: 'Validates multi-layer security hardening',
      testFile: './security/security-hardening.spec.js',
      requirements: ['REQ-HAR-001', 'REQ-HAR-002'],
      enabled: true,
      timeout: 20000
    });

    // Compliance Test Suite
    this.testSuites.set('compliance', {
      id: 'compliance',
      name: 'Compliance Validation Tests',
      category: SecurityTestCategory.COMPLIANCE,
      severity: TestSeverity.MEDIUM,
      description: 'Validates compliance framework and audit trails',
      testFile: './security/compliance-framework.spec.js',
      requirements: ['REQ-COMP-001', 'REQ-COMP-002'],
      enabled: true,
      timeout: 25000
    });

    // Penetration Test Suite
    this.testSuites.set('penetration', {
      id: 'penetration',
      name: 'Penetration Tests',
      category: SecurityTestCategory.PENETRATION,
      severity: TestSeverity.CRITICAL,
      description: 'Simulates real-world attack scenarios',
      testFile: './security/penetration-tests.spec.js',
      requirements: ['REQ-PEN-001', 'REQ-PEN-002'],
      enabled: true,
      timeout: 30000
    });

    // Performance Security Test Suite
    this.testSuites.set('performance-security', {
      id: 'performance-security',
      name: 'Security Performance Tests',
      category: SecurityTestCategory.PERFORMANCE,
      severity: TestSeverity.MEDIUM,
      description: 'Validates security overhead and performance impact',
      testFile: './security/performance-security.spec.js',
      requirements: ['REQ-PERF-001'],
      enabled: this.options.enablePerformanceTesting,
      timeout: 60000
    });
  }

  /**
   * Start continuous testing
   */
  startContinuousTesting() {
    // Run full test suite every hour
    this.continuousInterval = setInterval(() => {
      this.runFullTestSuite();
    }, 60 * 60 * 1000); // Hourly

    // Run quick security checks every 15 minutes
    this.quickCheckInterval = setInterval(() => {
      this.runQuickSecurityChecks();
    }, 15 * 60 * 1000); // Every 15 minutes

    // Run regression tests when triggered by events
    this.setupRegressionTriggers();

    // Run initial test suite
    setTimeout(() => {
      this.runFullTestSuite();
    }, 5000); // 5 seconds after startup
  }

  /**
   * Setup regression testing triggers
   */
  setupRegressionTriggers() {
    if (!this.options.enableRegressionTesting) return;

    // Monitor security events for potential regressions
    this.monitor.on('security:threat', (event) => {
      if (event.severity === 'CRITICAL' && !event.blocked) {
        this.triggerRegressionTests('Critical threat not blocked');
      }
    });

    // Monitor compliance violations
    this.compliance.on?.('compliance:critical', (event) => {
      this.triggerRegressionTests('Critical compliance violation');
    });
  }

  /**
   * Run full security test suite
   */
  async runFullTestSuite() {
    const startTime = performance.now();
    console.log(chalk.blue('🧪 Running Full Security Test Suite...'));

    const results = {
      runId: this.generateRunId(),
      timestamp: new Date().toISOString(),
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        error: 0
      },
      duration: 0,
      status: TestStatus.PENDING,
      criticalFailures: [],
      regressions: [],
      securityIssues: []
    };

    try {
      // Run test suites in parallel (with concurrency limit)
      const enabledSuites = Array.from(this.testSuites.values()).filter(suite => suite.enabled);
      const suiteGroups = this.groupTestSuites(enabledSuites);

      for (const group of suiteGroups) {
        const groupPromises = group.map(suite => this.runTestSuite(suite));
        const groupResults = await Promise.allSettled(groupPromises);

        groupResults.forEach((result, index) => {
          const suite = group[index];
          if (result.status === 'fulfilled') {
            results.suites[suite.id] = result.value;
          } else {
            results.suites[suite.id] = {
              id: suite.id,
              name: suite.name,
              status: TestStatus.ERROR,
              error: result.reason.message,
              duration: 0,
              tests: []
            };
          }
        });
      }

      // Calculate summary
      for (const suiteResult of Object.values(results.suites)) {
        results.summary.total += suiteResult.tests?.length || 0;

        if (suiteResult.status === TestStatus.PASSED) {
          results.summary.passed += suiteResult.tests?.length || 0;
        } else if (suiteResult.status === TestStatus.FAILED) {
          results.summary.failed += suiteResult.tests?.filter(t => t.status === TestStatus.FAILED).length || 0;
          results.summary.passed += suiteResult.tests?.filter(t => t.status === TestStatus.PASSED).length || 0;
        } else if (suiteResult.status === TestStatus.SKIPPED) {
          results.summary.skipped += suiteResult.tests?.length || 0;
        } else if (suiteResult.status === TestStatus.ERROR) {
          results.summary.error += 1;
        }
      }

      results.duration = performance.now() - startTime;

      // Determine overall status
      if (results.summary.error > 0 || results.summary.failed > 0) {
        results.status = TestStatus.FAILED;
      } else if (results.summary.skipped > 0) {
        results.status = TestStatus.SKIPPED;
      } else {
        results.status = TestStatus.PASSED;
      }

      // Check for critical failures
      results.criticalFailures = this.identifyCriticalFailures(results);

      // Check for regressions
      if (this.options.enableRegressionTesting) {
        results.regressions = await this.detectRegressions(results);
      }

      // Identify security issues
      results.securityIssues = this.identifySecurityIssues(results);

      // Store results
      this.storeTestResults(results);

      // Update metrics
      this.updateMetrics(results);

      // Generate reports
      await this.generateTestReport(results);

      // Log results
      this.logTestResults(results);

      // Handle critical failures
      if (results.criticalFailures.length > this.options.criticalFailureThreshold) {
        this.handleCriticalFailures(results);
      }

      return results;

    } catch (error) {
      console.error(chalk.red('🔥 Test Suite Execution Failed:'), error.message);

      results.status = TestStatus.ERROR;
      results.error = error.message;
      results.duration = performance.now() - startTime;

      return results;
    }
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite) {
    const startTime = performance.now();
    const result = {
      id: suite.id,
      name: suite.name,
      category: suite.category,
      severity: suite.severity,
      status: TestStatus.RUNNING,
      duration: 0,
      tests: [],
      error: null,
      requirements: suite.requirements,
      coverage: {}
    };

    this.runningTests.add(suite.id);

    try {
      console.log(chalk.gray(`  Running ${suite.name}...`));

      // Execute test file
      const testOutput = await this.executeTestFile(suite.testFile, suite.timeout);

      // Parse test results
      result.tests = this.parseTestOutput(testOutput);
      result.status = this.determineTestSuiteStatus(result.tests);
      result.coverage = this.calculateRequirementCoverage(result.tests, suite.requirements);

      result.duration = performance.now() - startTime;

      console.log(
        chalk.gray(`  ✓ ${suite.name} completed`),
        this.getStatusIndicator(result.status),
        chalk.gray(`(${result.duration.toFixed(2)}ms)`)
      );

    } catch (error) {
      result.status = TestStatus.ERROR;
      result.error = error.message;
      result.duration = performance.now() - startTime;

      console.log(
        chalk.red(`  ✗ ${suite.name} failed`),
        chalk.gray(`(${error.message})`)
      );
    } finally {
      this.runningTests.delete(suite.id);
    }

    return result;
  }

  /**
   * Execute test file using npm test or vitest
   */
  async executeTestFile(testFile, timeout) {
    return new Promise((resolve, reject) => {
      // Determine test command based on file extension and project setup
      let command, args;

      if (testFile.endsWith('.spec.js')) {
        command = 'npm';
        args = ['test', testFile];
      } else {
        command = 'npx';
        args = ['vitest', 'run', testFile, '--reporter=json'];
      }

      const child = spawn(command, args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 || code === null) {
          resolve({ stdout, stderr, exitCode: code });
        } else {
          reject(new Error(`Test execution failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute test: ${error.message}`));
      });

      // Handle timeout
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Test execution timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Parse test output to extract test results
   */
  parseTestOutput(output) {
    const tests = [];

    try {
      // Try to parse JSON output first (from vitest --reporter=json)
      const jsonMatch = output.stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return this.parseJSONTestResults(result);
      }

      // Fall back to parsing text output
      return this.parseTextTestResults(output.stdout);

    } catch (error) {
      // If parsing fails, create a synthetic test result
      return [{
        name: 'Test Execution',
        status: output.stderr ? TestStatus.FAILED : TestStatus.PASSED,
        duration: 0,
        error: output.stderr || null,
        requirements: []
      }];
    }
  }

  /**
   * Parse JSON test results
   */
  parseJSONTestResults(result) {
    const tests = [];

    if (result.testResults) {
      result.testResults.forEach(testFile => {
        testFile.assertionResults?.forEach(test => {
          tests.push({
            name: test.title || test.fullName,
            status: test.status === 'passed' ? TestStatus.PASSED :
                   test.status === 'failed' ? TestStatus.FAILED :
                   test.status === 'skipped' ? TestStatus.SKIPPED :
                   TestStatus.ERROR,
            duration: test.duration || 0,
            error: test.failureMessages?.join('\n') || null,
            requirements: this.extractRequirements(test.title || test.fullName)
          });
        });
      });
    }

    return tests;
  }

  /**
   * Parse text test results
   */
  parseTextTestResults(output) {
    const tests = [];
    const lines = output.split('\n');

    let currentTest = null;
    for (const line of lines) {
      // Look for test patterns
      const testMatch = line.match(/^\s*[✓✗]\s*(.+?)(?:\s+\((\d+)ms\))?$/);
      if (testMatch) {
        if (currentTest) {
          tests.push(currentTest);
        }

        currentTest = {
          name: testMatch[1].trim(),
          status: line.includes('✓') ? TestStatus.PASSED : TestStatus.FAILED,
          duration: parseInt(testMatch[2]) || 0,
          error: null,
          requirements: this.extractRequirements(testMatch[1])
        };
      }

      // Look for error messages
      if (currentTest && line.trim().startsWith('Error:')) {
        currentTest.error = line.trim();
      }
    }

    if (currentTest) {
      tests.push(currentTest);
    }

    return tests.length > 0 ? tests : [{
      name: 'Test Suite',
      status: output.includes('✗') ? TestStatus.FAILED : TestStatus.PASSED,
      duration: 0,
      error: null,
      requirements: []
    }];
  }

  /**
   * Extract requirement IDs from test names
   */
  extractRequirements(testName) {
    const reqPattern = /REQ-[A-Z0-9]+-\d+/g;
    return testName.match(reqPattern) || [];
  }

  /**
   * Determine test suite status based on individual tests
   */
  determineTestSuiteStatus(tests) {
    if (tests.length === 0) return TestStatus.SKIPPED;

    const hasFailures = tests.some(test => test.status === TestStatus.FAILED);
    const hasErrors = tests.some(test => test.status === TestStatus.ERROR);
    const hasSkipped = tests.some(test => test.status === TestStatus.SKIPPED);

    if (hasErrors) return TestStatus.ERROR;
    if (hasFailures) return TestStatus.FAILED;
    if (hasSkipped && tests.every(test => test.status === TestStatus.SKIPPED)) return TestStatus.SKIPPED;

    return TestStatus.PASSED;
  }

  /**
   * Calculate requirement coverage
   */
  calculateRequirementCoverage(tests, requirements) {
    const coverage = {};
    const testedRequirements = new Set();

    tests.forEach(test => {
      test.requirements.forEach(req => {
        testedRequirements.add(req);
        coverage[req] = {
          tested: true,
          status: test.status,
          testName: test.name
        };
      });
    });

    // Mark untested requirements
    requirements.forEach(req => {
      if (!testedRequirements.has(req)) {
        coverage[req] = {
          tested: false,
          status: TestStatus.SKIPPED,
          testName: null
        };
      }
    });

    return coverage;
  }

  /**
   * Group test suites for parallel execution
   */
  groupTestSuites(suites) {
    const groups = [];
    const groupSize = this.options.maxConcurrentTests;

    for (let i = 0; i < suites.length; i += groupSize) {
      groups.push(suites.slice(i, i + groupSize));
    }

    return groups;
  }

  /**
   * Run quick security checks
   */
  async runQuickSecurityChecks() {
    console.log(chalk.gray('🔍 Running Quick Security Checks...'));

    const quickSuites = Array.from(this.testSuites.values()).filter(
      suite => suite.category === SecurityTestCategory.UNIT && suite.severity === TestSeverity.CRITICAL
    );

    const results = [];
    for (const suite of quickSuites) {
      try {
        const result = await this.runTestSuite(suite);
        results.push(result);

        if (result.status === TestStatus.FAILED) {
          console.warn(chalk.yellow(`⚠️  Quick check failed: ${suite.name}`));
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Quick check error: ${suite.name} - ${error.message}`));
      }
    }

    return results;
  }

  /**
   * Trigger regression tests
   */
  async triggerRegressionTests(reason) {
    console.log(chalk.yellow(`🔄 Triggering Regression Tests: ${reason}`));

    const regressionSuites = Array.from(this.testSuites.values()).filter(
      suite => suite.category === SecurityTestCategory.REGRESSION ||
               suite.severity === TestSeverity.CRITICAL
    );

    const results = [];
    for (const suite of regressionSuites) {
      try {
        const result = await this.runTestSuite(suite);
        results.push(result);
      } catch (error) {
        console.error(chalk.red(`Regression test failed: ${suite.name} - ${error.message}`));
      }
    }

    // Generate regression report
    await this.generateRegressionReport(results, reason);

    return results;
  }

  /**
   * Identify critical failures
   */
  identifyCriticalFailures(results) {
    const criticalFailures = [];

    for (const [suiteId, suiteResult] of Object.entries(results.suites)) {
      const suite = this.testSuites.get(suiteId);

      if (suite?.severity === TestSeverity.CRITICAL && suiteResult.status === TestStatus.FAILED) {
        criticalFailures.push({
          suiteId,
          suiteName: suite.name,
          category: suite.category,
          requirements: suite.requirements,
          failedTests: suiteResult.tests?.filter(test => test.status === TestStatus.FAILED) || [],
          impact: 'Security controls may be compromised'
        });
      }
    }

    return criticalFailures;
  }

  /**
   * Detect regressions by comparing with historical results
   */
  async detectRegressions(currentResults) {
    const regressions = [];

    try {
      const historicalResults = this.loadHistoricalResults();
      if (!historicalResults || historicalResults.length === 0) {
        return regressions; // No historical data for comparison
      }

      const lastResults = historicalResults[historicalResults.length - 1];

      // Compare test success rates
      for (const [suiteId, currentSuite] of Object.entries(currentResults.suites)) {
        const lastSuite = lastResults.suites?.[suiteId];
        if (!lastSuite) continue;

        const currentSuccessRate = this.calculateSuccessRate(currentSuite);
        const lastSuccessRate = this.calculateSuccessRate(lastSuite);

        const regression = lastSuccessRate - currentSuccessRate;
        if (regression > this.options.regressionThreshold) {
          regressions.push({
            suiteId,
            suiteName: currentSuite.name,
            regressionPercent: (regression * 100).toFixed(2),
            currentSuccessRate: (currentSuccessRate * 100).toFixed(2),
            previousSuccessRate: (lastSuccessRate * 100).toFixed(2),
            impact: 'Test success rate decreased significantly'
          });
        }
      }

    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not detect regressions: ${error.message}`));
    }

    return regressions;
  }

  /**
   * Calculate success rate for test suite
   */
  calculateSuccessRate(suiteResult) {
    if (!suiteResult.tests || suiteResult.tests.length === 0) {
      return suiteResult.status === TestStatus.PASSED ? 1 : 0;
    }

    const passedTests = suiteResult.tests.filter(test => test.status === TestStatus.PASSED).length;
    return passedTests / suiteResult.tests.length;
  }

  /**
   * Identify security issues from test results
   */
  identifySecurityIssues(results) {
    const securityIssues = [];

    for (const [suiteId, suiteResult] of Object.entries(results.suites)) {
      const suite = this.testSuites.get(suiteId);

      if (suiteResult.status === TestStatus.FAILED) {
        const failedTests = suiteResult.tests?.filter(test => test.status === TestStatus.FAILED) || [];

        failedTests.forEach(test => {
          securityIssues.push({
            suiteId,
            suiteName: suite?.name,
            testName: test.name,
            severity: suite?.severity || TestSeverity.MEDIUM,
            requirements: test.requirements,
            error: test.error,
            impact: this.assessSecurityImpact(suite, test)
          });
        });
      }
    }

    return securityIssues;
  }

  /**
   * Assess security impact of failed test
   */
  assessSecurityImpact(suite, test) {
    if (suite?.category === SecurityTestCategory.PENETRATION) {
      return 'Critical: System vulnerable to real-world attacks';
    }

    if (suite?.severity === TestSeverity.CRITICAL) {
      return 'High: Core security controls may be bypassed';
    }

    if (test.requirements?.some(req => req.includes('SEC'))) {
      return 'Medium: Security requirement not satisfied';
    }

    return 'Low: Potential security weakness identified';
  }

  /**
   * Store test results for historical analysis
   */
  storeTestResults(results) {
    const resultsFile = join(this.options.testResultsPath, `test-results-${Date.now()}.json`);
    this.writeFile(resultsFile, JSON.stringify(results, null, 2));

    // Maintain historical results
    this.updateHistoricalResults(results);

    // Store in memory for quick access
    this.testResults.set(results.runId, results);

    // Cleanup old results (keep last 50 runs)
    if (this.testResults.size > 50) {
      const oldestKey = this.testResults.keys().next().value;
      this.testResults.delete(oldestKey);
    }
  }

  /**
   * Update historical results summary
   */
  updateHistoricalResults(results) {
    const historyFile = join(this.options.testResultsPath, 'test-history.json');
    let history = [];

    if (existsSync(historyFile)) {
      try {
        history = JSON.parse(readFileSync(historyFile, 'utf8'));
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not read test history: ${error.message}`));
      }
    }

    // Add current results summary
    history.push({
      runId: results.runId,
      timestamp: results.timestamp,
      summary: results.summary,
      status: results.status,
      duration: results.duration,
      criticalFailures: results.criticalFailures.length,
      regressions: results.regressions.length,
      securityIssues: results.securityIssues.length
    });

    // Keep last 100 runs
    if (history.length > 100) {
      history = history.slice(-100);
    }

    this.writeFile(historyFile, JSON.stringify(history, null, 2));
  }

  /**
   * Load historical results
   */
  loadHistoricalResults() {
    const historyFile = join(this.options.testResultsPath, 'test-history.json');

    if (existsSync(historyFile)) {
      try {
        return JSON.parse(readFileSync(historyFile, 'utf8'));
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not load test history: ${error.message}`));
      }
    }

    return [];
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport(results) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        runId: results.runId,
        reportVersion: '1.0.0',
        pipelineVersion: '1.0.0'
      },
      executiveSummary: {
        overallStatus: results.status,
        totalTests: results.summary.total,
        passRate: results.summary.total > 0 ?
          ((results.summary.passed / results.summary.total) * 100).toFixed(2) + '%' : '0%',
        duration: results.duration.toFixed(2) + 'ms',
        criticalFailures: results.criticalFailures.length,
        regressions: results.regressions.length,
        securityIssues: results.securityIssues.length
      },
      testResults: results.suites,
      criticalFailures: results.criticalFailures,
      regressions: results.regressions,
      securityIssues: results.securityIssues,
      recommendations: this.generateRecommendations(results),
      metrics: this.getMetrics()
    };

    const reportFile = join(this.options.reportPath, `security-test-report-${Date.now()}.json`);
    this.writeFile(reportFile, JSON.stringify(report, null, 2));

    // Generate HTML report for better readability
    await this.generateHTMLReport(report, reportFile.replace('.json', '.html'));

    this.metrics.reportGenerated++;

    return report;
  }

  /**
   * Generate regression report
   */
  async generateRegressionReport(results, reason) {
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        trigger: reason,
        reportType: 'REGRESSION_ANALYSIS'
      },
      trigger: reason,
      results: results,
      analysis: this.analyzeRegressionResults(results),
      recommendations: this.generateRegressionRecommendations(results)
    };

    const reportFile = join(this.options.reportPath, `regression-report-${Date.now()}.json`);
    this.writeFile(reportFile, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report, filePath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Security Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-error { color: #fd7e14; }
        .critical { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 10px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Test Report</h1>
        <p>Generated: ${report.metadata.generatedAt}</p>
        <p>Run ID: ${report.metadata.runId}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Overall Status</h3>
            <p class="status-${report.executiveSummary.overallStatus.toLowerCase()}">${report.executiveSummary.overallStatus}</p>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <p>${report.executiveSummary.passRate}</p>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <p>${report.executiveSummary.duration}</p>
        </div>
        <div class="metric">
            <h3>Total Tests</h3>
            <p>${report.executiveSummary.totalTests}</p>
        </div>
    </div>

    ${report.criticalFailures.length > 0 ? `
    <div class="critical">
        <h2>Critical Failures (${report.criticalFailures.length})</h2>
        ${report.criticalFailures.map(failure => `
        <div>
            <h4>${failure.suiteName}</h4>
            <p>${failure.impact}</p>
            <p>Requirements: ${failure.requirements.join(', ')}</p>
        </div>
        `).join('')}
    </div>
    ` : ''}

    <h2>Test Suite Results</h2>
    <table class="table">
        <thead>
            <tr>
                <th>Suite</th>
                <th>Status</th>
                <th>Tests</th>
                <th>Duration</th>
                <th>Category</th>
                <th>Severity</th>
            </tr>
        </thead>
        <tbody>
            ${Object.values(report.testResults).map(suite => `
            <tr>
                <td>${suite.name}</td>
                <td class="status-${suite.status.toLowerCase()}">${suite.status}</td>
                <td>${suite.tests?.length || 0}</td>
                <td>${suite.duration?.toFixed(2) || 0}ms</td>
                <td>${suite.category}</td>
                <td>${suite.severity}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Recommendations</h2>
    <ul>
        ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>
    `;

    this.writeFile(filePath, html);
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.criticalFailures.length > 0) {
      recommendations.push('IMMEDIATE: Address critical security test failures before deployment');
    }

    if (results.regressions.length > 0) {
      recommendations.push('HIGH: Investigate security regressions and restore previous security posture');
    }

    if (results.securityIssues.length > 0) {
      recommendations.push('MEDIUM: Review and remediate identified security issues');
    }

    if (results.summary.total === 0) {
      recommendations.push('HIGH: No tests executed - verify test suite configuration');
    } else if ((results.summary.passed / results.summary.total) < 0.95) {
      recommendations.push('MEDIUM: Test pass rate below 95% - improve test reliability');
    }

    if (results.duration > 300000) { // 5 minutes
      recommendations.push('LOW: Test execution time is high - consider optimizing test performance');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue regular security testing and monitoring');
    }

    return recommendations;
  }

  /**
   * Update pipeline metrics
   */
  updateMetrics(results) {
    this.metrics.totalTests += results.summary.total;
    this.metrics.passedTests += results.summary.passed;
    this.metrics.failedTests += results.summary.failed;
    this.metrics.skippedTests += results.summary.skipped;
    this.metrics.errorTests += results.summary.error;
    this.metrics.totalExecutionTime += results.duration;
    this.metrics.lastRun = results.timestamp;
    this.metrics.regressions += results.regressions.length;
    this.metrics.securityIssues += results.securityIssues.length;
  }

  /**
   * Log test results
   */
  logTestResults(results) {
    console.log(
      chalk.blue('🧪 Security Test Suite Complete'),
      `\n${chalk.yellow('Overall Status:')} ${this.getStatusColor(results.status)}`,
      `\n${chalk.yellow('Total Tests:')} ${results.summary.total}`,
      `\n${chalk.yellow('Passed:')} ${chalk.green(results.summary.passed)}`,
      `\n${chalk.yellow('Failed:')} ${chalk.red(results.summary.failed)}`,
      `\n${chalk.yellow('Skipped:')} ${chalk.yellow(results.summary.skipped)}`,
      `\n${chalk.yellow('Errors:')} ${chalk.red(results.summary.error)}`,
      `\n${chalk.yellow('Duration:')} ${results.duration.toFixed(2)}ms`
    );

    if (results.criticalFailures.length > 0) {
      console.error(chalk.red(`🚨 ${results.criticalFailures.length} Critical Security Failures Detected`));
    }

    if (results.regressions.length > 0) {
      console.warn(chalk.yellow(`⚠️  ${results.regressions.length} Security Regressions Detected`));
    }
  }

  /**
   * Handle critical failures
   */
  handleCriticalFailures(results) {
    console.error(
      chalk.red.bold('🔥 CRITICAL SECURITY TEST FAILURES'),
      `\n${results.criticalFailures.length} critical security tests failed`,
      `\nImmediate action required before production deployment`
    );

    // Emit critical test failure event
    this.monitor.emit('testing:critical', {
      timestamp: new Date().toISOString(),
      runId: results.runId,
      failures: results.criticalFailures
    });
  }

  /**
   * Utility methods
   */
  ensureDirectories() {
    [this.options.testResultsPath, this.options.reportPath].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  writeFile(path, content) {
    try {
      writeFileSync(path, content, 'utf8');
    } catch (error) {
      console.error(chalk.red('Failed to write file:'), error.message);
    }
  }

  generateRunId() {
    return `RUN-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  getStatusIndicator(status) {
    switch (status) {
      case TestStatus.PASSED:
        return chalk.green('✓');
      case TestStatus.FAILED:
        return chalk.red('✗');
      case TestStatus.SKIPPED:
        return chalk.yellow('⊘');
      case TestStatus.ERROR:
        return chalk.red('⚠');
      default:
        return chalk.gray('?');
    }
  }

  getStatusColor(status) {
    switch (status) {
      case TestStatus.PASSED:
        return chalk.green(status);
      case TestStatus.FAILED:
        return chalk.red(status);
      case TestStatus.SKIPPED:
        return chalk.yellow(status);
      case TestStatus.ERROR:
        return chalk.red(status);
      default:
        return chalk.gray(status);
    }
  }

  analyzeRegressionResults(results) {
    // Implementation for regression analysis
    return {
      totalRegressions: results.filter(r => r.status === TestStatus.FAILED).length,
      criticalRegressions: results.filter(r => r.severity === TestSeverity.CRITICAL && r.status === TestStatus.FAILED).length,
      recommendation: 'Review failed tests and restore security controls'
    };
  }

  generateRegressionRecommendations(results) {
    return [
      'Investigate root cause of regression trigger',
      'Review recent changes that may have affected security',
      'Restore security controls if compromised',
      'Enhance monitoring to prevent future regressions'
    ];
  }

  /**
   * Get pipeline metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      testSuites: this.testSuites.size,
      activeTests: this.runningTests.size,
      passRate: this.metrics.totalTests > 0 ?
        ((this.metrics.passedTests / this.metrics.totalTests) * 100).toFixed(2) + '%' : '0%',
      avgExecutionTime: this.metrics.totalTests > 0 ?
        (this.metrics.totalExecutionTime / this.metrics.totalTests).toFixed(2) + 'ms' : '0ms'
    };
  }

  /**
   * Shutdown testing pipeline
   */
  shutdown() {
    if (this.continuousInterval) {
      clearInterval(this.continuousInterval);
    }

    if (this.quickCheckInterval) {
      clearInterval(this.quickCheckInterval);
    }

    // Wait for running tests to complete
    if (this.runningTests.size > 0) {
      console.log(chalk.yellow(`⏳ Waiting for ${this.runningTests.size} running tests to complete...`));
    }

    console.log(
      chalk.yellow('🧪 Security Testing Pipeline Shutdown'),
      `\nTotal Tests: ${this.metrics.totalTests}`,
      `\nPass Rate: ${this.getMetrics().passRate}`,
      `\nRegressions: ${this.metrics.regressions}`,
      `\nSecurity Issues: ${this.metrics.securityIssues}`
    );
  }
}

/**
 * Global testing pipeline instance
 */
let globalPipeline = null;

/**
 * Get or create global security testing pipeline
 * @param {Object} options - Pipeline options
 * @returns {SecurityTestingPipeline} Global pipeline instance
 */
export function getSecurityTestingPipeline(options = {}) {
  if (!globalPipeline) {
    globalPipeline = new SecurityTestingPipeline(options);
  }
  return globalPipeline;
}

/**
 * Run security tests for CLI components
 * @returns {Promise<Object>} Test results
 */
export async function runCLISecurityTests() {
  const pipeline = getSecurityTestingPipeline();
  const cliSuite = pipeline.testSuites.get('cli-security');
  return await pipeline.runTestSuite(cliSuite);
}

/**
 * Run quick security validation
 * @returns {Promise<Object>} Quick test results
 */
export async function runQuickSecurityValidation() {
  const pipeline = getSecurityTestingPipeline();
  return await pipeline.runQuickSecurityChecks();
}

export default SecurityTestingPipeline;