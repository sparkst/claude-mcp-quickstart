#!/usr/bin/env node

/**
 * REQ-PERF-024: Agent Coordination Performance Monitor
 * Monitors cross-territory handoffs and coordination performance
 */

import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 * REQ-PERF-025: Agent performance tracking configuration
 */
const COORDINATION_CONFIG = {
  // Performance thresholds (milliseconds)
  thresholds: {
    handoffTime: 100,        // Agent handoff should be < 100ms
    totalWorkflow: 5000,     // Complete workflow should be < 5s
    memoryDelta: 50 * 1024 * 1024, // Memory increase < 50MB
  },

  // Monitored operations
  operations: [
    'qnew-to-planner',
    'planner-to-docs-writer',
    'qcode-to-test-writer',
    'test-writer-to-debugger',
    'qcheck-to-pe-reviewer',
    'pe-reviewer-to-security-reviewer',
    'qdoc-to-docs-writer',
    'qgit-to-release-manager'
  ],

  // Sampling configuration
  sampling: {
    enabled: true,
    rate: 0.1, // 10% sampling rate
    maxSamples: 1000
  }
};

/**
 * REQ-PERF-026: Performance measurement utilities
 */
class AgentCoordinationMonitor {
  constructor() {
    this.measurements = new Map();
    this.activeOperations = new Map();
    this.performanceLog = [];
  }

  /**
   * REQ-PERF-027: Start measuring an agent operation
   * @param {string} operationId - Unique operation identifier
   * @param {string} fromAgent - Source agent
   * @param {string} toAgent - Target agent
   * @param {Object} context - Operation context
   */
  startOperation(operationId, fromAgent, toAgent, context = {}) {
    const measurement = {
      operationId,
      fromAgent,
      toAgent,
      context,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      startTimestamp: new Date().toISOString()
    };

    this.activeOperations.set(operationId, measurement);
    return operationId;
  }

  /**
   * REQ-PERF-028: Complete measuring an agent operation
   * @param {string} operationId - Operation identifier
   * @param {Object} result - Operation result
   * @returns {Object} - Performance metrics
   */
  endOperation(operationId, result = {}) {
    const measurement = this.activeOperations.get(operationId);
    if (!measurement) {
      return { error: 'Operation not found' };
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - measurement.startTime;

    const metrics = {
      ...measurement,
      endTime,
      endMemory,
      duration,
      endTimestamp: new Date().toISOString(),
      result,
      performance: {
        handoffTime: duration,
        memoryDelta: {
          rss: endMemory.rss - measurement.startMemory.rss,
          heapUsed: endMemory.heapUsed - measurement.startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - measurement.startMemory.heapTotal
        },
        thresholdsMet: {
          handoffTime: duration <= COORDINATION_CONFIG.thresholds.handoffTime,
          memoryDelta: (endMemory.rss - measurement.startMemory.rss) <= COORDINATION_CONFIG.thresholds.memoryDelta
        }
      }
    };

    this.measurements.set(operationId, metrics);
    this.activeOperations.delete(operationId);
    this.performanceLog.push(metrics);

    // REQ-PERF-029: Auto-cleanup old measurements
    if (this.performanceLog.length > COORDINATION_CONFIG.sampling.maxSamples) {
      this.performanceLog.shift();
    }

    return metrics;
  }

  /**
   * REQ-PERF-030: Monitor a complete agent workflow
   * @param {string} workflowId - Workflow identifier
   * @param {Function} workflowFn - Workflow function to monitor
   * @returns {Promise<Object>} - Workflow result with performance metrics
   */
  async monitorWorkflow(workflowId, workflowFn) {
    const workflowStart = performance.now();
    const workflowStartMemory = process.memoryUsage();

    try {
      const result = await workflowFn();
      const workflowEnd = performance.now();
      const workflowEndMemory = process.memoryUsage();

      const workflowMetrics = {
        workflowId,
        duration: workflowEnd - workflowStart,
        memoryDelta: workflowEndMemory.rss - workflowStartMemory.rss,
        success: true,
        timestamp: new Date().toISOString(),
        thresholdsMet: {
          totalWorkflow: (workflowEnd - workflowStart) <= COORDINATION_CONFIG.thresholds.totalWorkflow,
          memoryDelta: (workflowEndMemory.rss - workflowStartMemory.rss) <= COORDINATION_CONFIG.thresholds.memoryDelta
        }
      };

      return { result, metrics: workflowMetrics };
    } catch (error) {
      const workflowEnd = performance.now();
      const workflowEndMemory = process.memoryUsage();

      const workflowMetrics = {
        workflowId,
        duration: workflowEnd - workflowStart,
        memoryDelta: workflowEndMemory.rss - workflowStartMemory.rss,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      throw { error, metrics: workflowMetrics };
    }
  }

  /**
   * REQ-PERF-031: Generate performance report
   * @returns {Object} - Performance analysis
   */
  generateReport() {
    const measurements = Array.from(this.measurements.values());
    const recentMeasurements = this.performanceLog.slice(-100); // Last 100 operations

    if (measurements.length === 0) {
      return {
        summary: 'No performance data available',
        recommendations: ['Run agent operations to collect performance data']
      };
    }

    const handoffTimes = measurements.map(m => m.performance.handoffTime);
    const memoryDeltas = measurements.map(m => m.performance.memoryDelta.rss);

    const stats = {
      handoffTime: {
        min: Math.min(...handoffTimes),
        max: Math.max(...handoffTimes),
        average: handoffTimes.reduce((a, b) => a + b, 0) / handoffTimes.length,
        median: handoffTimes.sort()[Math.floor(handoffTimes.length / 2)],
        threshold: COORDINATION_CONFIG.thresholds.handoffTime,
        violations: handoffTimes.filter(t => t > COORDINATION_CONFIG.thresholds.handoffTime).length
      },
      memoryUsage: {
        averageDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        maxDelta: Math.max(...memoryDeltas),
        threshold: COORDINATION_CONFIG.thresholds.memoryDelta,
        violations: memoryDeltas.filter(m => m > COORDINATION_CONFIG.thresholds.memoryDelta).length
      },
      totalOperations: measurements.length,
      successRate: measurements.filter(m => m.result && !m.result.error).length / measurements.length
    };

    const recommendations = [];
    if (stats.handoffTime.violations > 0) {
      recommendations.push(`${stats.handoffTime.violations} handoff time violations detected (>${COORDINATION_CONFIG.thresholds.handoffTime}ms)`);
    }
    if (stats.memoryUsage.violations > 0) {
      recommendations.push(`${stats.memoryUsage.violations} memory usage violations detected (>${COORDINATION_CONFIG.thresholds.memoryDelta / 1024 / 1024}MB)`);
    }
    if (stats.handoffTime.average > COORDINATION_CONFIG.thresholds.handoffTime * 0.8) {
      recommendations.push('Average handoff time approaching threshold - consider optimization');
    }

    return {
      summary: `Analyzed ${stats.totalOperations} operations with ${(stats.successRate * 100).toFixed(1)}% success rate`,
      stats,
      recommendations,
      lastMeasurement: measurements[measurements.length - 1]?.endTimestamp,
      configuredThresholds: COORDINATION_CONFIG.thresholds
    };
  }

  /**
   * REQ-PERF-032: Save performance data for trend analysis
   * @param {string} outputPath - Output file path
   */
  async savePerformanceData(outputPath) {
    const report = this.generateReport();
    const data = {
      report,
      measurements: Array.from(this.measurements.values()),
      config: COORDINATION_CONFIG,
      exportTimestamp: new Date().toISOString()
    };

    await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
    return outputPath;
  }
}

/**
 * REQ-PERF-033: Global monitor instance
 */
const globalMonitor = new AgentCoordinationMonitor();

/**
 * REQ-PERF-034: Easy-to-use monitoring decorators
 */
export function monitorAgentOperation(fromAgent, toAgent) {
  return function decorator(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const operationId = `${fromAgent}-${toAgent}-${Date.now()}`;
      globalMonitor.startOperation(operationId, fromAgent, toAgent, { args });

      try {
        const result = await originalMethod.apply(this, args);
        globalMonitor.endOperation(operationId, { success: true, result });
        return result;
      } catch (error) {
        globalMonitor.endOperation(operationId, { success: false, error: error.message });
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * REQ-PERF-035: CLI interface for performance monitoring
 */
async function runPerformanceMonitoring() {
  console.log('🔍 Agent Coordination Performance Monitor\n');

  const report = globalMonitor.generateReport();

  console.log('📊 Performance Summary:');
  console.log(`   ${report.summary}\n`);

  if (report.stats) {
    console.log('⏱️  Handoff Performance:');
    console.log(`   Average: ${report.stats.handoffTime.average.toFixed(2)}ms`);
    console.log(`   Median:  ${report.stats.handoffTime.median.toFixed(2)}ms`);
    console.log(`   Range:   ${report.stats.handoffTime.min.toFixed(2)}ms - ${report.stats.handoffTime.max.toFixed(2)}ms`);
    console.log(`   Target:  <${report.stats.handoffTime.threshold}ms`);
    console.log(`   Violations: ${report.stats.handoffTime.violations}\n`);

    console.log('💾 Memory Performance:');
    console.log(`   Avg Delta: ${(report.stats.memoryUsage.averageDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Max Delta: ${(report.stats.memoryUsage.maxDelta / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Target:    <${(report.stats.memoryUsage.threshold / 1024 / 1024).toFixed(0)}MB`);
    console.log(`   Violations: ${report.stats.memoryUsage.violations}\n`);
  }

  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    console.log();
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), '.performance', `agent-coordination-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await globalMonitor.savePerformanceData(reportPath);
  console.log(`💾 Detailed report saved to: ${reportPath}\n`);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceMonitoring().catch(console.error);
}

export { AgentCoordinationMonitor, globalMonitor, monitorAgentOperation, COORDINATION_CONFIG };
export default globalMonitor;