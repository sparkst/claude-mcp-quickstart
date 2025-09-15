#!/usr/bin/env node

/**
 * REQ-PERF-036: Performance Regression Testing System
 * Comprehensive performance monitoring with regression detection
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

/**
 * REQ-PERF-037: Performance baseline configuration
 */
const PERFORMANCE_BASELINE = {
  // CLI Performance baselines (milliseconds)
  cli: {
    version: { target: 200, regression: 300 },    // Current optimized: ~60ms
    help: { target: 250, regression: 400 },       // Current optimized: ~80ms
    setup: { target: 5000, regression: 8000 },    // Setup command
  },

  // Test Performance baselines (milliseconds)
  tests: {
    unit: { target: 5000, regression: 10000 },     // All unit tests
    integration: { target: 30000, regression: 60000 }, // Integration tests
    package: { target: 5000, regression: 15000 },  // Package validation tests
  },

  // Memory baselines (bytes)
  memory: {
    cliStartup: { target: 50 * 1024 * 1024, regression: 100 * 1024 * 1024 }, // 50MB
    testSuite: { target: 200 * 1024 * 1024, regression: 400 * 1024 * 1024 }, // 200MB
    agentWorkflow: { target: 30 * 1024 * 1024, regression: 60 * 1024 * 1024 }, // 30MB
  },

  // Agent coordination baselines (milliseconds)
  agents: {
    handoff: { target: 100, regression: 200 },     // Agent handoff time
    workflow: { target: 5000, regression: 10000 }, // Complete workflow
  }
};

/**
 * REQ-PERF-038: Performance measurement runner
 */
class PerformanceRegressionMonitor {
  constructor() {
    this.results = {
      cli: {},
      tests: {},
      memory: {},
      agents: {},
      summary: {}
    };
    this.regressions = [];
    this.improvements = [];
  }

  /**
   * REQ-PERF-039: Run CLI performance benchmarks
   */
  async measureCLIPerformance() {
    console.log(chalk.cyan('🚀 Measuring CLI Performance...'));

    const cliTests = [
      { name: 'version', args: ['--version'] },
      { name: 'help', args: ['--help'] }
    ];

    for (const test of cliTests) {
      const measurements = [];

      // Warm up
      await this.runCLICommand(test.args);

      // Measure 5 iterations
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await this.runCLICommand(test.args);
        const duration = performance.now() - startTime;
        measurements.push(duration);
      }

      const median = measurements.sort((a, b) => a - b)[Math.floor(measurements.length / 2)];
      this.results.cli[test.name] = {
        median,
        measurements,
        baseline: PERFORMANCE_BASELINE.cli[test.name],
        status: this.getStatus(median, PERFORMANCE_BASELINE.cli[test.name])
      };

      if (this.results.cli[test.name].status === 'regression') {
        this.regressions.push(`CLI ${test.name}: ${median.toFixed(2)}ms (baseline: ${PERFORMANCE_BASELINE.cli[test.name].target}ms)`);
      }

      console.log(`   ${this.getStatusEmoji(this.results.cli[test.name].status)} ${test.name}: ${median.toFixed(2)}ms`);
    }
  }

  /**
   * REQ-PERF-040: Run test performance benchmarks
   */
  async measureTestPerformance() {
    console.log(chalk.cyan('\n🧪 Measuring Test Performance...'));

    const testSuites = [
      { name: 'unit', command: 'npm test -- --testTimeout=30000' },
      { name: 'package', command: 'npm test -- --testTimeout=5000 package-validation.spec.js' }
    ];

    for (const suite of testSuites) {
      try {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();

        execSync(suite.command, {
          stdio: 'pipe',
          timeout: PERFORMANCE_BASELINE.tests[suite.name].regression
        });

        const duration = performance.now() - startTime;
        const endMemory = process.memoryUsage();
        const memoryDelta = endMemory.rss - startMemory.rss;

        this.results.tests[suite.name] = {
          duration,
          memoryDelta,
          baseline: PERFORMANCE_BASELINE.tests[suite.name],
          status: this.getStatus(duration, PERFORMANCE_BASELINE.tests[suite.name])
        };

        if (this.results.tests[suite.name].status === 'regression') {
          this.regressions.push(`Test ${suite.name}: ${duration.toFixed(2)}ms (baseline: ${PERFORMANCE_BASELINE.tests[suite.name].target}ms)`);
        }

        console.log(`   ${this.getStatusEmoji(this.results.tests[suite.name].status)} ${suite.name}: ${duration.toFixed(2)}ms`);

      } catch (error) {
        this.results.tests[suite.name] = {
          duration: PERFORMANCE_BASELINE.tests[suite.name].regression,
          error: error.message,
          status: 'failed'
        };
        this.regressions.push(`Test ${suite.name}: FAILED (${error.message})`);
        console.log(`   ❌ ${suite.name}: FAILED`);
      }
    }
  }

  /**
   * REQ-PERF-041: Measure memory performance
   */
  async measureMemoryPerformance() {
    console.log(chalk.cyan('\n💾 Measuring Memory Performance...'));

    // CLI startup memory
    const startMemory = process.memoryUsage();
    await this.runCLICommand(['--version']);
    const cliMemoryDelta = process.memoryUsage().rss - startMemory.rss;

    this.results.memory.cliStartup = {
      usage: cliMemoryDelta,
      baseline: PERFORMANCE_BASELINE.memory.cliStartup,
      status: this.getStatus(cliMemoryDelta, PERFORMANCE_BASELINE.memory.cliStartup)
    };

    console.log(`   ${this.getStatusEmoji(this.results.memory.cliStartup.status)} CLI Startup: ${(cliMemoryDelta / 1024 / 1024).toFixed(2)}MB`);

    if (this.results.memory.cliStartup.status === 'regression') {
      this.regressions.push(`Memory CLI startup: ${(cliMemoryDelta / 1024 / 1024).toFixed(2)}MB (baseline: ${(PERFORMANCE_BASELINE.memory.cliStartup.target / 1024 / 1024).toFixed(2)}MB)`);
    }
  }

  /**
   * REQ-PERF-042: Helper methods
   */
  async runCLICommand(args) {
    return new Promise((resolve, reject) => {
      const child = execSync(`node index.js ${args.join(' ')}`, {
        stdio: 'pipe',
        timeout: 5000
      });
      resolve();
    });
  }

  getStatus(value, baseline) {
    if (value <= baseline.target) return 'excellent';
    if (value <= baseline.regression) return 'acceptable';
    return 'regression';
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'excellent': return '🟢';
      case 'acceptable': return '🟡';
      case 'regression': return '🔴';
      case 'failed': return '❌';
      default: return '⚪';
    }
  }

  /**
   * REQ-PERF-043: Generate comprehensive report
   */
  generateReport() {
    const totalTests = Object.keys(this.results.cli).length +
                      Object.keys(this.results.tests).length +
                      Object.keys(this.results.memory).length;

    const excellentCount = this.countByStatus('excellent');
    const acceptableCount = this.countByStatus('acceptable');
    const regressionCount = this.countByStatus('regression');
    const failedCount = this.countByStatus('failed');

    this.results.summary = {
      totalTests,
      excellentCount,
      acceptableCount,
      regressionCount,
      failedCount,
      overallStatus: regressionCount > 0 ? 'REGRESSIONS_DETECTED' :
                     failedCount > 0 ? 'TESTS_FAILED' :
                     'ALL_PERFORMANCE_TARGETS_MET',
      timestamp: new Date().toISOString()
    };

    return this.results;
  }

  countByStatus(status) {
    let count = 0;
    ['cli', 'tests', 'memory'].forEach(category => {
      Object.values(this.results[category]).forEach(result => {
        if (result.status === status) count++;
      });
    });
    return count;
  }

  /**
   * REQ-PERF-044: Display results
   */
  displayReport() {
    const report = this.generateReport();
    const { summary } = report;

    console.log(chalk.cyan('\n📊 Performance Regression Analysis\n'));

    // Summary table
    console.log('┌─────────────────┬───────┬──────────┬────────────┬─────────┐');
    console.log('│ Category        │ Tests │ Excellent│ Acceptable │ Regression│');
    console.log('├─────────────────┼───────┼──────────┼────────────┼─────────┤');

    ['cli', 'tests', 'memory'].forEach(category => {
      const categoryResults = this.results[category];
      const total = Object.keys(categoryResults).length;
      const excellent = Object.values(categoryResults).filter(r => r.status === 'excellent').length;
      const acceptable = Object.values(categoryResults).filter(r => r.status === 'acceptable').length;
      const regression = Object.values(categoryResults).filter(r => r.status === 'regression').length;

      console.log(`│ ${category.padEnd(15)} │ ${total.toString().padEnd(5)} │ ${excellent.toString().padEnd(8)} │ ${acceptable.toString().padEnd(10)} │ ${regression.toString().padEnd(9)} │`);
    });

    console.log('└─────────────────┴───────┴──────────┴────────────┴─────────┘\n');

    // Overall status
    const statusColor = summary.overallStatus === 'ALL_PERFORMANCE_TARGETS_MET' ? chalk.green :
                       summary.overallStatus === 'TESTS_FAILED' ? chalk.red :
                       chalk.yellow;

    console.log(statusColor(`🎯 Overall Status: ${summary.overallStatus}\n`));

    // Regressions
    if (this.regressions.length > 0) {
      console.log(chalk.red('🔴 Performance Regressions Detected:'));
      this.regressions.forEach(regression => {
        console.log(chalk.red(`   • ${regression}`));
      });
      console.log();
    }

    // Improvements
    if (this.improvements.length > 0) {
      console.log(chalk.green('🟢 Performance Improvements:'));
      this.improvements.forEach(improvement => {
        console.log(chalk.green(`   • ${improvement}`));
      });
      console.log();
    }

    return summary.overallStatus === 'ALL_PERFORMANCE_TARGETS_MET';
  }

  /**
   * REQ-PERF-045: Save results for CI/CD
   */
  async saveResults() {
    const report = this.generateReport();
    const perfDir = path.join(process.cwd(), '.performance');
    await fs.mkdir(perfDir, { recursive: true });

    const filename = `regression-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(perfDir, filename);

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Performance report saved to: ${filepath}\n`);

    return filepath;
  }
}

/**
 * REQ-PERF-046: Main execution
 */
async function runPerformanceRegressionTest() {
  const monitor = new PerformanceRegressionMonitor();

  try {
    await monitor.measureCLIPerformance();
    await monitor.measureTestPerformance();
    await monitor.measureMemoryPerformance();

    const success = monitor.displayReport();
    await monitor.saveResults();

    // Exit with appropriate code for CI/CD
    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error(chalk.red('❌ Performance regression test failed:'), error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceRegressionTest();
}

export { PerformanceRegressionMonitor, PERFORMANCE_BASELINE };
export default PerformanceRegressionMonitor;