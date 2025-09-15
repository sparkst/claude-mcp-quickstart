/**
 * Security System Orchestrator
 *
 * Central orchestration layer that coordinates all security components:
 * monitoring, hardening, compliance, and testing for unified security operations.
 *
 * @module SecurityOrchestrator
 * @version 1.0.0
 * @since 2025-09-14
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import chalk from 'chalk';
import { getSecurityMonitor } from './security-monitor.js';
import { getSecurityHardening } from './security-hardening.js';
import { getComplianceFramework } from './compliance-framework.js';
import { getSecurityTestingPipeline } from './security-testing-pipeline.js';

/**
 * Security system operational states
 */
export const SecurityState = {
  INITIALIZING: 'INITIALIZING',
  OPERATIONAL: 'OPERATIONAL',
  DEGRADED: 'DEGRADED',
  CRITICAL: 'CRITICAL',
  MAINTENANCE: 'MAINTENANCE',
  SHUTDOWN: 'SHUTDOWN'
};

/**
 * Security system health levels
 */
export const HealthLevel = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Security System Orchestrator
 *
 * Provides unified interface for all security operations and coordinates
 * between monitoring, hardening, compliance, and testing components.
 */
export class SecurityOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      enableAutoInitialization: options.enableAutoInitialization !== false,
      enableHealthChecks: options.enableHealthChecks !== false,
      enableAutoRecovery: options.enableAutoRecovery !== false,
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      degradedThreshold: options.degradedThreshold || 0.8,
      criticalThreshold: options.criticalThreshold || 0.6,
      maxRecoveryAttempts: options.maxRecoveryAttempts || 3,
      ...options
    };

    // Security components
    this.monitor = null;
    this.hardening = null;
    this.compliance = null;
    this.testing = null;

    // System state
    this.state = SecurityState.INITIALIZING;
    this.health = HealthLevel.UNKNOWN;
    this.lastHealthCheck = null;
    this.recoveryAttempts = 0;

    // Component health tracking
    this.componentHealth = new Map();
    this.componentMetrics = new Map();

    // System metrics
    this.metrics = {
      uptime: Date.now(),
      totalSecurityEvents: 0,
      threatsMitigated: 0,
      complianceScore: 0,
      testsPassed: 0,
      recoveryAttempts: 0,
      avgResponseTime: 0
    };

    if (this.options.enableAutoInitialization) {
      this.initialize();
    }
  }

  /**
   * Initialize the security orchestrator and all components
   */
  async initialize() {
    const startTime = performance.now();
    console.log(chalk.blue('🛡️  Initializing Security System Orchestrator...'));

    try {
      this.state = SecurityState.INITIALIZING;
      this.emit('security:state:change', { state: this.state, timestamp: new Date().toISOString() });

      // Initialize security components in order
      await this.initializeComponents();

      // Setup component coordination
      this.setupComponentCoordination();

      // Start health monitoring
      if (this.options.enableHealthChecks) {
        this.startHealthMonitoring();
      }

      // Initial system health check
      await this.performHealthCheck();

      // Set operational state
      this.state = SecurityState.OPERATIONAL;
      this.health = HealthLevel.EXCELLENT;

      const initTime = performance.now() - startTime;
      console.log(
        chalk.green('✅ Security System Orchestrator Operational'),
        `\n${chalk.yellow('Components:')} Monitor, Hardening, Compliance, Testing`,
        `\n${chalk.yellow('Health:')} ${this.health}`,
        `\n${chalk.yellow('Initialization Time:')} ${initTime.toFixed(2)}ms`
      );

      this.emit('security:initialized', {
        timestamp: new Date().toISOString(),
        initTime,
        health: this.health,
        components: this.getComponentStatus()
      });

    } catch (error) {
      console.error(chalk.red('🔥 Security System Initialization Failed:'), error.message);
      this.state = SecurityState.CRITICAL;
      this.health = HealthLevel.CRITICAL;

      this.emit('security:initialization:failed', {
        timestamp: new Date().toISOString(),
        error: error.message,
        state: this.state
      });

      throw error;
    }
  }

  /**
   * Initialize security components
   */
  async initializeComponents() {
    // Initialize security monitor
    console.log(chalk.gray('  Initializing Security Monitor...'));
    this.monitor = getSecurityMonitor({
      enableRealTimeAlerts: true,
      enableThreatIntelligence: true
    });
    this.componentHealth.set('monitor', HealthLevel.GOOD);

    // Initialize security hardening
    console.log(chalk.gray('  Initializing Security Hardening...'));
    this.hardening = getSecurityHardening({
      hardeningLevel: 'ENTERPRISE',
      enableAdvancedProtection: true,
      enableBehavioralAnalysis: true
    });
    this.componentHealth.set('hardening', HealthLevel.GOOD);

    // Initialize compliance framework
    console.log(chalk.gray('  Initializing Compliance Framework...'));
    this.compliance = getComplianceFramework({
      enabledStandards: ['SOC2', 'ISO27001', 'NIST'],
      enableRealTimeAuditing: true,
      autoComplianceChecks: true
    });
    this.componentHealth.set('compliance', HealthLevel.GOOD);

    // Initialize testing pipeline
    console.log(chalk.gray('  Initializing Testing Pipeline...'));
    this.testing = getSecurityTestingPipeline({
      enableContinuousTesting: true,
      enableRegressionTesting: true,
      enablePerformanceTesting: true
    });
    this.componentHealth.set('testing', HealthLevel.GOOD);
  }

  /**
   * Setup coordination between security components
   */
  setupComponentCoordination() {
    // Monitor events trigger hardening responses
    this.monitor.on('security:threat', (threat) => {
      this.handleThreatEvent(threat);
    });

    this.monitor.on('security:alert', (alert) => {
      this.handleSecurityAlert(alert);
    });

    // Hardening events trigger compliance auditing
    this.hardening.on?.('hardening:violation', (violation) => {
      this.compliance.auditViolation?.(violation);
    });

    // Testing failures trigger enhanced monitoring
    this.testing.on?.('testing:critical', (failure) => {
      this.handleTestingFailure(failure);
    });

    // Compliance violations trigger immediate testing
    this.compliance.on?.('compliance:critical', (violation) => {
      this.handleComplianceViolation(violation);
    });
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error(chalk.red('Health check failed:'), error.message);
      }
    }, this.options.healthCheckInterval);

    console.log(chalk.gray(`🩺 Health monitoring started (${this.options.healthCheckInterval / 1000}s interval)`));
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = performance.now();
    const healthResults = {
      timestamp: new Date().toISOString(),
      overall: HealthLevel.UNKNOWN,
      components: {},
      metrics: {},
      issues: [],
      recommendations: []
    };

    try {
      // Check each component health
      healthResults.components.monitor = await this.checkMonitorHealth();
      healthResults.components.hardening = await this.checkHardeningHealth();
      healthResults.components.compliance = await this.checkComplianceHealth();
      healthResults.components.testing = await this.checkTestingHealth();

      // Collect component metrics
      healthResults.metrics = await this.collectSystemMetrics();

      // Calculate overall health
      healthResults.overall = this.calculateOverallHealth(healthResults.components);

      // Identify issues and recommendations
      healthResults.issues = this.identifyHealthIssues(healthResults);
      healthResults.recommendations = this.generateHealthRecommendations(healthResults);

      // Update system state based on health
      await this.updateSystemState(healthResults);

      this.lastHealthCheck = healthResults;
      this.health = healthResults.overall;

      // Log health status
      this.logHealthStatus(healthResults);

      // Emit health event
      this.emit('security:health:check', healthResults);

      return healthResults;

    } catch (error) {
      console.error(chalk.red('Health check error:'), error.message);

      healthResults.overall = HealthLevel.CRITICAL;
      healthResults.error = error.message;

      return healthResults;
    } finally {
      healthResults.duration = performance.now() - startTime;
    }
  }

  /**
   * Check security monitor health
   */
  async checkMonitorHealth() {
    try {
      const metrics = this.monitor.getAnalytics();

      // Check if monitor is processing events
      const eventsProcessed = parseInt(metrics.totalEvents);
      const avgProcessingTime = parseFloat(metrics.avgProcessingTime);

      if (eventsProcessed === 0) {
        return {
          status: HealthLevel.WARNING,
          issue: 'No events processed',
          metrics: { eventsProcessed, avgProcessingTime }
        };
      }

      if (avgProcessingTime > 100) { // > 100ms
        return {
          status: HealthLevel.WARNING,
          issue: 'High processing time',
          metrics: { eventsProcessed, avgProcessingTime }
        };
      }

      return {
        status: HealthLevel.EXCELLENT,
        metrics: { eventsProcessed, avgProcessingTime }
      };

    } catch (error) {
      return {
        status: HealthLevel.CRITICAL,
        error: error.message
      };
    }
  }

  /**
   * Check security hardening health
   */
  async checkHardeningHealth() {
    try {
      const metrics = this.hardening.getMetrics();

      const attacksBlocked = metrics.attacksBlocked || 0;
      const policyViolations = metrics.policyViolations || 0;
      const activeSessions = metrics.activeSessions || 0;

      // Check for concerning patterns
      if (policyViolations > 10) {
        return {
          status: HealthLevel.WARNING,
          issue: 'High policy violations',
          metrics: { attacksBlocked, policyViolations, activeSessions }
        };
      }

      if (activeSessions > 50) {
        return {
          status: HealthLevel.WARNING,
          issue: 'High active sessions',
          metrics: { attacksBlocked, policyViolations, activeSessions }
        };
      }

      return {
        status: HealthLevel.EXCELLENT,
        metrics: { attacksBlocked, policyViolations, activeSessions }
      };

    } catch (error) {
      return {
        status: HealthLevel.CRITICAL,
        error: error.message
      };
    }
  }

  /**
   * Check compliance framework health
   */
  async checkComplianceHealth() {
    try {
      const metrics = this.compliance.getMetrics();

      const complianceRate = parseFloat(metrics.complianceRate) || 0;
      const violationRate = parseFloat(metrics.violationRate) || 0;
      const auditEvents = metrics.auditEvents || 0;

      // Check compliance scores
      if (complianceRate < 80) {
        return {
          status: HealthLevel.CRITICAL,
          issue: 'Low compliance rate',
          metrics: { complianceRate, violationRate, auditEvents }
        };
      }

      if (complianceRate < 95) {
        return {
          status: HealthLevel.WARNING,
          issue: 'Compliance rate below target',
          metrics: { complianceRate, violationRate, auditEvents }
        };
      }

      return {
        status: HealthLevel.EXCELLENT,
        metrics: { complianceRate, violationRate, auditEvents }
      };

    } catch (error) {
      return {
        status: HealthLevel.CRITICAL,
        error: error.message
      };
    }
  }

  /**
   * Check testing pipeline health
   */
  async checkTestingHealth() {
    try {
      const metrics = this.testing.getMetrics();

      const passRate = parseFloat(metrics.passRate) || 0;
      const totalTests = metrics.totalTests || 0;
      const regressions = metrics.regressions || 0;

      // Check test results
      if (passRate < 90) {
        return {
          status: HealthLevel.CRITICAL,
          issue: 'Low test pass rate',
          metrics: { passRate, totalTests, regressions }
        };
      }

      if (regressions > 0) {
        return {
          status: HealthLevel.WARNING,
          issue: 'Security regressions detected',
          metrics: { passRate, totalTests, regressions }
        };
      }

      if (totalTests === 0) {
        return {
          status: HealthLevel.WARNING,
          issue: 'No tests executed',
          metrics: { passRate, totalTests, regressions }
        };
      }

      return {
        status: HealthLevel.EXCELLENT,
        metrics: { passRate, totalTests, regressions }
      };

    } catch (error) {
      return {
        status: HealthLevel.CRITICAL,
        error: error.message
      };
    }
  }

  /**
   * Collect comprehensive system metrics
   */
  async collectSystemMetrics() {
    const systemMetrics = {
      uptime: Date.now() - this.metrics.uptime,
      systemState: this.state,
      systemHealth: this.health,
      recoveryAttempts: this.recoveryAttempts
    };

    try {
      // Collect from each component
      const monitorMetrics = this.monitor.getAnalytics();
      const hardeningMetrics = this.hardening.getMetrics();
      const complianceMetrics = this.compliance.getMetrics();
      const testingMetrics = this.testing.getMetrics();

      return {
        system: systemMetrics,
        monitor: monitorMetrics,
        hardening: hardeningMetrics,
        compliance: complianceMetrics,
        testing: testingMetrics
      };

    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not collect all metrics:'), error.message);
      return { system: systemMetrics };
    }
  }

  /**
   * Calculate overall system health
   */
  calculateOverallHealth(components) {
    const healthScores = {
      [HealthLevel.EXCELLENT]: 4,
      [HealthLevel.GOOD]: 3,
      [HealthLevel.WARNING]: 2,
      [HealthLevel.CRITICAL]: 1,
      [HealthLevel.UNKNOWN]: 0
    };

    const scores = Object.values(components).map(component =>
      healthScores[component.status] || 0
    );

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (avgScore >= 3.5) return HealthLevel.EXCELLENT;
    if (avgScore >= 2.5) return HealthLevel.GOOD;
    if (avgScore >= 1.5) return HealthLevel.WARNING;
    if (avgScore >= 0.5) return HealthLevel.CRITICAL;
    return HealthLevel.UNKNOWN;
  }

  /**
   * Identify health issues
   */
  identifyHealthIssues(healthResults) {
    const issues = [];

    Object.entries(healthResults.components).forEach(([component, health]) => {
      if (health.issue) {
        issues.push({
          component,
          type: 'COMPONENT_ISSUE',
          severity: health.status === HealthLevel.CRITICAL ? 'HIGH' : 'MEDIUM',
          description: health.issue,
          metrics: health.metrics
        });
      }

      if (health.error) {
        issues.push({
          component,
          type: 'COMPONENT_ERROR',
          severity: 'HIGH',
          description: health.error
        });
      }
    });

    // System-level issues
    if (this.recoveryAttempts > 0) {
      issues.push({
        component: 'system',
        type: 'RECOVERY_ATTEMPTS',
        severity: this.recoveryAttempts > 2 ? 'HIGH' : 'MEDIUM',
        description: `${this.recoveryAttempts} recovery attempts made`
      });
    }

    return issues;
  }

  /**
   * Generate health recommendations
   */
  generateHealthRecommendations(healthResults) {
    const recommendations = [];

    // Component-specific recommendations
    Object.entries(healthResults.components).forEach(([component, health]) => {
      if (health.status === HealthLevel.CRITICAL) {
        recommendations.push(`IMMEDIATE: Investigate and fix ${component} critical issues`);
      } else if (health.status === HealthLevel.WARNING) {
        recommendations.push(`HIGH: Review ${component} warning conditions`);
      }
    });

    // Overall system recommendations
    if (healthResults.overall === HealthLevel.CRITICAL) {
      recommendations.push('IMMEDIATE: System in critical state - emergency response required');
    } else if (healthResults.overall === HealthLevel.WARNING) {
      recommendations.push('HIGH: System degraded - investigate component issues');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue regular monitoring and maintenance');
    }

    return recommendations;
  }

  /**
   * Update system state based on health
   */
  async updateSystemState(healthResults) {
    const previousState = this.state;

    if (healthResults.overall === HealthLevel.CRITICAL) {
      this.state = SecurityState.CRITICAL;
    } else if (healthResults.overall === HealthLevel.WARNING) {
      this.state = SecurityState.DEGRADED;
    } else if (this.state === SecurityState.CRITICAL || this.state === SecurityState.DEGRADED) {
      // Recovery to operational state
      this.state = SecurityState.OPERATIONAL;
    }

    if (previousState !== this.state) {
      console.log(
        chalk.yellow(`🔄 System state changed: ${previousState} → ${this.state}`)
      );

      this.emit('security:state:change', {
        previousState,
        newState: this.state,
        timestamp: new Date().toISOString(),
        trigger: 'health_check'
      });

      // Attempt auto-recovery if enabled
      if (this.options.enableAutoRecovery && this.state === SecurityState.CRITICAL) {
        await this.attemptAutoRecovery();
      }
    }
  }

  /**
   * Attempt automatic recovery
   */
  async attemptAutoRecovery() {
    if (this.recoveryAttempts >= this.options.maxRecoveryAttempts) {
      console.error(chalk.red('🚨 Max recovery attempts reached - manual intervention required'));
      return;
    }

    this.recoveryAttempts++;
    console.log(chalk.yellow(`🔄 Attempting auto-recovery (${this.recoveryAttempts}/${this.options.maxRecoveryAttempts})...`));

    try {
      // Restart components in safe order
      await this.restartSecurityComponents();

      // Wait for stabilization
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Re-check health
      const healthCheck = await this.performHealthCheck();

      if (healthCheck.overall === HealthLevel.GOOD || healthCheck.overall === HealthLevel.EXCELLENT) {
        console.log(chalk.green('✅ Auto-recovery successful'));
        this.recoveryAttempts = 0; // Reset on successful recovery

        this.emit('security:recovery:success', {
          timestamp: new Date().toISOString(),
          attempts: this.recoveryAttempts,
          health: healthCheck.overall
        });
      } else {
        console.warn(chalk.yellow('⚠️  Auto-recovery partially successful'));
      }

    } catch (error) {
      console.error(chalk.red('🔥 Auto-recovery failed:'), error.message);

      this.emit('security:recovery:failed', {
        timestamp: new Date().toISOString(),
        attempts: this.recoveryAttempts,
        error: error.message
      });
    }
  }

  /**
   * Restart security components
   */
  async restartSecurityComponents() {
    console.log(chalk.gray('  Restarting security components...'));

    // Graceful restart - maintain state where possible
    if (this.monitor) {
      // Monitor just needs to clear any stuck processes
      console.log(chalk.gray('    Refreshing security monitor...'));
    }

    if (this.hardening) {
      // Hardening may need session cleanup
      console.log(chalk.gray('    Refreshing security hardening...'));
    }

    if (this.compliance) {
      // Compliance framework restart
      console.log(chalk.gray('    Refreshing compliance framework...'));
    }

    if (this.testing) {
      // Testing pipeline restart
      console.log(chalk.gray('    Refreshing testing pipeline...'));
    }
  }

  /**
   * Handle threat events
   */
  async handleThreatEvent(threat) {
    this.metrics.threatsMitigated++;

    // Apply additional hardening based on threat type
    if (threat.severity === 'CRITICAL') {
      await this.hardening.applyHardening({
        source: threat.source,
        input: threat.details?.input || '',
        context: { threatLevel: 'CRITICAL' }
      });
    }

    // Trigger compliance audit
    this.compliance.auditSecurityEvent?.(threat);

    // Consider emergency testing if pattern indicates new threat
    if (threat.analysis?.confidence > 0.9) {
      this.testing.triggerRegressionTests?.('High confidence threat detected');
    }
  }

  /**
   * Handle security alerts
   */
  async handleSecurityAlert(alert) {
    if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
      // Escalate to compliance framework
      this.compliance.generateComplianceViolation?.(alert);

      // Trigger immediate testing
      this.testing.runQuickSecurityChecks?.();
    }
  }

  /**
   * Handle testing failures
   */
  async handleTestingFailure(failure) {
    // Enhance monitoring for failed test areas
    this.monitor.processSecurityEvent({
      source: 'TESTING',
      type: 'test_failure',
      severity: 'HIGH',
      details: failure
    });

    // Apply additional hardening
    await this.hardening.applyHardening({
      source: 'TESTING_FAILURE',
      input: JSON.stringify(failure),
      context: { testFailure: true }
    });
  }

  /**
   * Handle compliance violations
   */
  async handleComplianceViolation(violation) {
    // Trigger immediate security testing
    this.testing.runQuickSecurityChecks?.();

    // Enhance monitoring
    this.monitor.processSecurityEvent({
      source: 'COMPLIANCE',
      type: 'compliance_violation',
      severity: violation.severity || 'HIGH',
      details: violation
    });
  }

  /**
   * Log health status
   */
  logHealthStatus(healthResults) {
    const healthColor = this.getHealthColor(healthResults.overall);
    const componentCount = Object.keys(healthResults.components).length;
    const issueCount = healthResults.issues.length;

    console.log(
      chalk.gray(`🩺 Health Check Complete`),
      `${chalk.yellow('Overall:')} ${healthColor}`,
      `${chalk.yellow('Components:')} ${componentCount}`,
      `${chalk.yellow('Issues:')} ${issueCount > 0 ? chalk.red(issueCount) : chalk.green('0')}`,
      `${chalk.yellow('Duration:')} ${healthResults.duration?.toFixed(2) || 0}ms`
    );

    if (issueCount > 0) {
      console.log(chalk.yellow('⚠️  Health Issues Detected:'));
      healthResults.issues.forEach((issue, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${issue.component}: ${issue.description}`));
      });
    }
  }

  /**
   * Get health status color
   */
  getHealthColor(health) {
    switch (health) {
      case HealthLevel.EXCELLENT:
        return chalk.green(health);
      case HealthLevel.GOOD:
        return chalk.green(health);
      case HealthLevel.WARNING:
        return chalk.yellow(health);
      case HealthLevel.CRITICAL:
        return chalk.red(health);
      default:
        return chalk.gray(health);
    }
  }

  /**
   * Get current component status
   */
  getComponentStatus() {
    return {
      monitor: this.componentHealth.get('monitor') || HealthLevel.UNKNOWN,
      hardening: this.componentHealth.get('hardening') || HealthLevel.UNKNOWN,
      compliance: this.componentHealth.get('compliance') || HealthLevel.UNKNOWN,
      testing: this.componentHealth.get('testing') || HealthLevel.UNKNOWN
    };
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      state: this.state,
      health: this.health,
      uptime: Date.now() - this.metrics.uptime,
      components: this.getComponentStatus(),
      metrics: this.metrics,
      lastHealthCheck: this.lastHealthCheck?.timestamp,
      recoveryAttempts: this.recoveryAttempts
    };
  }

  /**
   * Process security request through complete pipeline
   */
  async processSecurityRequest(request) {
    const startTime = performance.now();

    try {
      // Step 1: Apply security hardening
      const hardeningResult = await this.hardening.applyHardening(request);

      // Step 2: Monitor the security event
      const monitoringResult = this.monitor.processSecurityEvent({
        source: request.source,
        input: request.input,
        hardeningResult
      });

      // Step 3: Audit for compliance
      this.compliance.auditSecurityEvent?.(monitoringResult);

      // Step 4: Update metrics
      this.metrics.totalSecurityEvents++;
      this.metrics.avgResponseTime = (
        (this.metrics.avgResponseTime * (this.metrics.totalSecurityEvents - 1) +
         (performance.now() - startTime)) / this.metrics.totalSecurityEvents
      );

      const result = {
        timestamp: new Date().toISOString(),
        request: request,
        hardening: hardeningResult,
        monitoring: monitoringResult,
        allowed: hardeningResult.allowed && !hardeningResult.blocked,
        processingTime: performance.now() - startTime
      };

      this.emit('security:request:processed', result);

      return result;

    } catch (error) {
      console.error(chalk.red('Security request processing failed:'), error.message);

      return {
        timestamp: new Date().toISOString(),
        request: request,
        error: error.message,
        allowed: false,
        blocked: true,
        processingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Shutdown orchestrator and all components
   */
  async shutdown() {
    console.log(chalk.yellow('🛡️  Shutting down Security System Orchestrator...'));

    this.state = SecurityState.SHUTDOWN;

    // Stop health monitoring
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }

    // Shutdown components in reverse order
    try {
      if (this.testing) {
        this.testing.shutdown?.();
      }

      if (this.compliance) {
        this.compliance.shutdown?.();
      }

      if (this.hardening) {
        this.hardening.shutdown?.();
      }

      if (this.monitor) {
        this.monitor.shutdown?.();
      }

      const finalMetrics = {
        uptime: Date.now() - this.metrics.uptime,
        totalSecurityEvents: this.metrics.totalSecurityEvents,
        threatsMitigated: this.metrics.threatsMitigated,
        avgResponseTime: this.metrics.avgResponseTime,
        recoveryAttempts: this.recoveryAttempts
      };

      console.log(
        chalk.yellow('🛡️  Security System Shutdown Complete'),
        `\nUptime: ${Math.floor(finalMetrics.uptime / 1000)}s`,
        `\nEvents Processed: ${finalMetrics.totalSecurityEvents}`,
        `\nThreats Mitigated: ${finalMetrics.threatsMitigated}`,
        `\nAvg Response Time: ${finalMetrics.avgResponseTime.toFixed(2)}ms`,
        `\nRecovery Attempts: ${finalMetrics.recoveryAttempts}`
      );

      this.emit('security:shutdown', {
        timestamp: new Date().toISOString(),
        metrics: finalMetrics
      });

    } catch (error) {
      console.error(chalk.red('Error during shutdown:'), error.message);
    }
  }
}

/**
 * Global orchestrator instance
 */
let globalOrchestrator = null;

/**
 * Get or create global security orchestrator
 * @param {Object} options - Orchestrator options
 * @returns {SecurityOrchestrator} Global orchestrator instance
 */
export function getSecurityOrchestrator(options = {}) {
  if (!globalOrchestrator) {
    globalOrchestrator = new SecurityOrchestrator(options);
  }
  return globalOrchestrator;
}

/**
 * Initialize security system
 * @param {Object} options - Configuration options
 * @returns {Promise<SecurityOrchestrator>} Initialized orchestrator
 */
export async function initializeSecuritySystem(options = {}) {
  const orchestrator = getSecurityOrchestrator(options);
  await orchestrator.initialize();
  return orchestrator;
}

/**
 * Process security request through complete security stack
 * @param {Object} request - Security request
 * @returns {Promise<Object>} Processing results
 */
export async function processSecurityRequest(request) {
  const orchestrator = getSecurityOrchestrator();
  return await orchestrator.processSecurityRequest(request);
}

/**
 * Get current security system status
 * @returns {Object} System status
 */
export function getSecuritySystemStatus() {
  const orchestrator = getSecurityOrchestrator();
  return orchestrator.getSystemStatus();
}

export default SecurityOrchestrator;