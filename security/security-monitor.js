/**
 * Real-Time Security Monitoring System
 *
 * Provides enterprise-grade security event monitoring, threat detection,
 * and automated response capabilities for the CLAUDE.md implementation system.
 *
 * @module SecurityMonitor
 * @version 1.0.0
 * @since 2025-09-14
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

/**
 * Security event severity levels
 */
export const SecuritySeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Security event types for classification
 */
export const SecurityEventType = {
  COMMAND_INJECTION: 'COMMAND_INJECTION',
  SCRIPT_INJECTION: 'SCRIPT_INJECTION',
  PATH_TRAVERSAL: 'PATH_TRAVERSAL',
  TEMPLATE_INJECTION: 'TEMPLATE_INJECTION',
  INFORMATION_DISCLOSURE: 'INFORMATION_DISCLOSURE',
  BRUTE_FORCE: 'BRUTE_FORCE',
  SUSPICIOUS_PATTERN: 'SUSPICIOUS_PATTERN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

/**
 * Real-time security monitoring system
 */
export class SecurityMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      alertThreshold: options.alertThreshold || 5, // Failed attempts before alert
      rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute window
      maxEventsPerWindow: options.maxEventsPerWindow || 20,
      enableRealTimeAlerts: options.enableRealTimeAlerts !== false,
      enableThreatIntelligence: options.enableThreatIntelligence !== false,
      logLevel: options.logLevel || 'INFO',
      ...options
    };

    // Security event tracking
    this.eventHistory = new Map();
    this.patternDatabase = this.initializePatternDatabase();
    this.threatSignatures = this.initializeThreatSignatures();
    this.rateTracker = new Map();

    // Performance metrics
    this.metrics = {
      eventsProcessed: 0,
      threatsDetected: 0,
      alertsTriggered: 0,
      processingTimeMs: 0,
      uptime: Date.now()
    };

    // Initialize monitoring
    this.startMonitoring();
  }

  /**
   * Initialize known attack pattern database
   */
  initializePatternDatabase() {
    return {
      // Command injection patterns
      commandInjection: [
        /\$\([^)]*\)/g,      // $(command)
        /`[^`]*`/g,          // `command`
        /;[\s]*[a-zA-Z]/g,   // ; command
        /\|\|[\s]*[a-zA-Z]/g, // || command
        /&&[\s]*[a-zA-Z]/g,   // && command
        />\s*\/[a-zA-Z]/g,    // > /path
        /<\s*\/[a-zA-Z]/g     // < /path
      ],

      // Script injection patterns
      scriptInjection: [
        /<script[^>]*>/gi,
        /<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /document\./gi,
        /window\./gi
      ],

      // Path traversal patterns
      pathTraversal: [
        /\.\.\/+/g,          // ../
        /\.\.\\+/g,          // ..\
        /\/etc\/passwd/gi,
        /\/windows\/system32/gi,
        /\.\.%2f/gi,         // URL encoded ../
        /\.\.%5c/gi          // URL encoded ..\
      ],

      // Template injection patterns
      templateInjection: [
        /\{\{[^}]*\}\}/g,    // {{expression}}
        /<\?[\s\S]*\?>/g,    // <?php code ?>
        /<%[\s\S]*%>/g,      // <% code %>
        /\$\{[^}]*\}/g       // ${expression}
      ]
    };
  }

  /**
   * Initialize threat intelligence signatures
   */
  initializeThreatSignatures() {
    return {
      // Known malicious patterns
      maliciousCommands: new Set([
        'rm -rf /',
        'format c:',
        'del /f /s /q',
        'wget',
        'curl',
        'nc -l',
        'python -c',
        'perl -e',
        'base64 -d'
      ]),

      // Suspicious file paths
      suspiciousFiles: new Set([
        '/etc/passwd',
        '/etc/shadow',
        '/windows/system32/cmd.exe',
        '/proc/self/environ',
        '/.bash_history',
        '/.ssh/id_rsa'
      ]),

      // Known attack tools
      attackTools: new Set([
        'sqlmap',
        'nmap',
        'metasploit',
        'burpsuite',
        'owasp-zap',
        'nikto'
      ])
    };
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    // Monitor rate limits every minute
    this.rateLimitInterval = setInterval(() => {
      this.cleanupRateTracker();
    }, this.options.rateLimitWindow);

    // Performance monitoring
    this.metricsInterval = setInterval(() => {
      this.emitMetrics();
    }, 30000); // Every 30 seconds

    this.emit('monitor:started', {
      timestamp: new Date().toISOString(),
      options: this.options
    });
  }

  /**
   * Process security event for analysis
   * @param {Object} event - Security event data
   * @returns {Object} Analysis results
   */
  processSecurityEvent(event) {
    const startTime = performance.now();

    try {
      const analysis = this.analyzeEvent(event);
      const severity = this.calculateSeverity(analysis);
      const isBlocked = this.shouldBlock(analysis, severity);

      const securityEvent = {
        id: this.generateEventId(event),
        timestamp: new Date().toISOString(),
        type: analysis.eventType,
        severity,
        source: event.source || 'unknown',
        details: event,
        analysis,
        blocked: isBlocked,
        processingTimeMs: performance.now() - startTime
      };

      // Update metrics
      this.metrics.eventsProcessed++;
      this.metrics.processingTimeMs += securityEvent.processingTimeMs;

      // Store in history
      this.storeEvent(securityEvent);

      // Check for threats
      if (this.isThreat(analysis, severity)) {
        this.handleThreat(securityEvent);
      }

      // Emit for real-time processing
      this.emit('security:event', securityEvent);

      return securityEvent;
    } catch (error) {
      this.emit('monitor:error', {
        error: error.message,
        event,
        timestamp: new Date().toISOString()
      });

      return {
        id: this.generateEventId(event),
        timestamp: new Date().toISOString(),
        type: SecurityEventType.SUSPICIOUS_PATTERN,
        severity: SecuritySeverity.HIGH,
        error: error.message,
        blocked: true
      };
    }
  }

  /**
   * Analyze security event for threats
   * @param {Object} event - Raw security event
   * @returns {Object} Analysis results
   */
  analyzeEvent(event) {
    const analysis = {
      eventType: SecurityEventType.SUSPICIOUS_PATTERN,
      confidence: 0,
      patterns: [],
      riskFactors: [],
      recommendation: 'ALLOW'
    };

    const input = event.input || event.command || '';

    // Check command injection patterns
    if (this.checkPatterns(input, this.patternDatabase.commandInjection)) {
      analysis.eventType = SecurityEventType.COMMAND_INJECTION;
      analysis.confidence += 0.8;
      analysis.patterns.push('command_injection');
      analysis.riskFactors.push('Shell metacharacters detected');
    }

    // Check script injection patterns
    if (this.checkPatterns(input, this.patternDatabase.scriptInjection)) {
      analysis.eventType = SecurityEventType.SCRIPT_INJECTION;
      analysis.confidence += 0.9;
      analysis.patterns.push('script_injection');
      analysis.riskFactors.push('Script execution patterns detected');
    }

    // Check path traversal patterns
    if (this.checkPatterns(input, this.patternDatabase.pathTraversal)) {
      analysis.eventType = SecurityEventType.PATH_TRAVERSAL;
      analysis.confidence += 0.7;
      analysis.patterns.push('path_traversal');
      analysis.riskFactors.push('Directory traversal attempted');
    }

    // Check template injection patterns
    if (this.checkPatterns(input, this.patternDatabase.templateInjection)) {
      analysis.eventType = SecurityEventType.TEMPLATE_INJECTION;
      analysis.confidence += 0.8;
      analysis.patterns.push('template_injection');
      analysis.riskFactors.push('Template expression detected');
    }

    // Check threat intelligence
    if (this.checkThreatIntelligence(input)) {
      analysis.confidence += 0.5;
      analysis.riskFactors.push('Known malicious pattern');
    }

    // Rate limiting check
    if (this.checkRateLimit(event.source)) {
      analysis.eventType = SecurityEventType.RATE_LIMIT_EXCEEDED;
      analysis.confidence += 0.6;
      analysis.riskFactors.push('Rate limit exceeded');
    }

    // Set recommendation based on confidence
    if (analysis.confidence >= 0.8) {
      analysis.recommendation = 'BLOCK';
    } else if (analysis.confidence >= 0.5) {
      analysis.recommendation = 'ALERT';
    }

    return analysis;
  }

  /**
   * Check input against pattern database
   * @param {string} input - Input to analyze
   * @param {Array} patterns - Regex patterns to check
   * @returns {boolean} True if patterns match
   */
  checkPatterns(input, patterns) {
    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * Check against threat intelligence database
   * @param {string} input - Input to analyze
   * @returns {boolean} True if threats detected
   */
  checkThreatIntelligence(input) {
    const lowerInput = input.toLowerCase();

    // Check malicious commands
    for (const command of this.threatSignatures.maliciousCommands) {
      if (lowerInput.includes(command.toLowerCase())) {
        return true;
      }
    }

    // Check suspicious file paths
    for (const path of this.threatSignatures.suspiciousFiles) {
      if (lowerInput.includes(path.toLowerCase())) {
        return true;
      }
    }

    // Check attack tools
    for (const tool of this.threatSignatures.attackTools) {
      if (lowerInput.includes(tool.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check rate limiting for source
   * @param {string} source - Event source identifier
   * @returns {boolean} True if rate limit exceeded
   */
  checkRateLimit(source = 'unknown') {
    const now = Date.now();
    const windowStart = now - this.options.rateLimitWindow;

    if (!this.rateTracker.has(source)) {
      this.rateTracker.set(source, []);
    }

    const events = this.rateTracker.get(source);

    // Remove old events
    const recentEvents = events.filter(timestamp => timestamp > windowStart);
    this.rateTracker.set(source, recentEvents);

    // Add current event
    recentEvents.push(now);

    return recentEvents.length > this.options.maxEventsPerWindow;
  }

  /**
   * Calculate severity based on analysis
   * @param {Object} analysis - Event analysis
   * @returns {string} Severity level
   */
  calculateSeverity(analysis) {
    if (analysis.confidence >= 0.9) {
      return SecuritySeverity.CRITICAL;
    } else if (analysis.confidence >= 0.7) {
      return SecuritySeverity.HIGH;
    } else if (analysis.confidence >= 0.4) {
      return SecuritySeverity.MEDIUM;
    } else {
      return SecuritySeverity.LOW;
    }
  }

  /**
   * Determine if event should be blocked
   * @param {Object} analysis - Event analysis
   * @param {string} severity - Event severity
   * @returns {boolean} True if should block
   */
  shouldBlock(analysis, severity) {
    return analysis.recommendation === 'BLOCK' ||
           severity === SecuritySeverity.CRITICAL ||
           (severity === SecuritySeverity.HIGH && analysis.confidence >= 0.8);
  }

  /**
   * Check if event represents a threat
   * @param {Object} analysis - Event analysis
   * @param {string} severity - Event severity
   * @returns {boolean} True if threat detected
   */
  isThreat(analysis, severity) {
    return severity === SecuritySeverity.HIGH ||
           severity === SecuritySeverity.CRITICAL ||
           analysis.confidence >= 0.6;
  }

  /**
   * Handle detected threat
   * @param {Object} securityEvent - Security event with threat
   */
  handleThreat(securityEvent) {
    this.metrics.threatsDetected++;

    // Log threat detection
    this.logThreat(securityEvent);

    // Trigger alerts if enabled
    if (this.options.enableRealTimeAlerts) {
      this.triggerAlert(securityEvent);
    }

    // Emit threat event
    this.emit('security:threat', securityEvent);

    // Auto-response for critical threats
    if (securityEvent.severity === SecuritySeverity.CRITICAL) {
      this.handleCriticalThreat(securityEvent);
    }
  }

  /**
   * Log threat to console with formatting
   * @param {Object} securityEvent - Security event
   */
  logThreat(securityEvent) {
    const level = securityEvent.severity === SecuritySeverity.CRITICAL ? 'ERROR' : 'WARN';
    const color = securityEvent.severity === SecuritySeverity.CRITICAL ? 'red' : 'yellow';

    console[level.toLowerCase()](
      chalk[color](`[SECURITY:${securityEvent.severity}] ${securityEvent.type} detected`),
      {
        id: securityEvent.id,
        confidence: securityEvent.analysis.confidence,
        patterns: securityEvent.analysis.patterns,
        blocked: securityEvent.blocked,
        timestamp: securityEvent.timestamp
      }
    );
  }

  /**
   * Trigger security alert
   * @param {Object} securityEvent - Security event
   */
  triggerAlert(securityEvent) {
    this.metrics.alertsTriggered++;

    const alert = {
      id: `ALERT-${Date.now()}`,
      eventId: securityEvent.id,
      severity: securityEvent.severity,
      type: securityEvent.type,
      confidence: securityEvent.analysis.confidence,
      riskFactors: securityEvent.analysis.riskFactors,
      timestamp: new Date().toISOString(),
      recommendedAction: this.getRecommendedAction(securityEvent)
    };

    this.emit('security:alert', alert);

    // Console alert for immediate visibility
    console.error(
      chalk.red.bold(`🚨 SECURITY ALERT [${alert.id}]`),
      `\n${chalk.yellow('Type:')} ${securityEvent.type}`,
      `\n${chalk.yellow('Severity:')} ${securityEvent.severity}`,
      `\n${chalk.yellow('Confidence:')} ${(securityEvent.analysis.confidence * 100).toFixed(1)}%`,
      `\n${chalk.yellow('Blocked:')} ${securityEvent.blocked ? 'YES' : 'NO'}`,
      `\n${chalk.yellow('Action:')} ${alert.recommendedAction}`
    );
  }

  /**
   * Get recommended action for security event
   * @param {Object} securityEvent - Security event
   * @returns {string} Recommended action
   */
  getRecommendedAction(securityEvent) {
    if (securityEvent.severity === SecuritySeverity.CRITICAL) {
      return 'IMMEDIATE RESPONSE - Block all traffic from source';
    } else if (securityEvent.severity === SecuritySeverity.HIGH) {
      return 'INVESTIGATE - Review logs and consider blocking source';
    } else if (securityEvent.severity === SecuritySeverity.MEDIUM) {
      return 'MONITOR - Increase logging for source';
    } else {
      return 'LOG - Continue monitoring';
    }
  }

  /**
   * Handle critical threat with immediate response
   * @param {Object} securityEvent - Critical security event
   */
  handleCriticalThreat(securityEvent) {
    // Emit critical threat for immediate response
    this.emit('security:critical', securityEvent);

    // Log critical threat
    console.error(
      chalk.red.bold('🔥 CRITICAL SECURITY THREAT DETECTED 🔥'),
      `\nEvent ID: ${securityEvent.id}`,
      `\nType: ${securityEvent.type}`,
      `\nConfidence: ${(securityEvent.analysis.confidence * 100).toFixed(1)}%`,
      `\nSource: ${securityEvent.source}`,
      `\nBlocked: ${securityEvent.blocked}`,
      `\nTimestamp: ${securityEvent.timestamp}`
    );
  }

  /**
   * Store security event in history
   * @param {Object} securityEvent - Event to store
   */
  storeEvent(securityEvent) {
    const hour = new Date().getHours();
    const key = `${new Date().toDateString()}-${hour}`;

    if (!this.eventHistory.has(key)) {
      this.eventHistory.set(key, []);
    }

    this.eventHistory.get(key).push(securityEvent);

    // Cleanup old history (keep last 24 hours)
    if (this.eventHistory.size > 24) {
      const oldestKey = this.eventHistory.keys().next().value;
      this.eventHistory.delete(oldestKey);
    }
  }

  /**
   * Generate unique event ID
   * @param {Object} event - Source event
   * @returns {string} Unique event ID
   */
  generateEventId(event) {
    const data = JSON.stringify({
      timestamp: Date.now(),
      source: event.source,
      input: event.input || event.command,
      random: Math.random()
    });

    return createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Clean up rate tracker
   */
  cleanupRateTracker() {
    const now = Date.now();
    const windowStart = now - this.options.rateLimitWindow;

    for (const [source, events] of this.rateTracker.entries()) {
      const recentEvents = events.filter(timestamp => timestamp > windowStart);

      if (recentEvents.length === 0) {
        this.rateTracker.delete(source);
      } else {
        this.rateTracker.set(source, recentEvents);
      }
    }
  }

  /**
   * Emit monitoring metrics
   */
  emitMetrics() {
    const currentMetrics = {
      ...this.metrics,
      uptimeMs: Date.now() - this.metrics.uptime,
      avgProcessingTime: this.metrics.eventsProcessed > 0
        ? this.metrics.processingTimeMs / this.metrics.eventsProcessed
        : 0,
      threatDetectionRate: this.metrics.eventsProcessed > 0
        ? this.metrics.threatsDetected / this.metrics.eventsProcessed
        : 0,
      activeSourceCount: this.rateTracker.size
    };

    this.emit('monitor:metrics', currentMetrics);
  }

  /**
   * Get security analytics summary
   * @returns {Object} Analytics summary
   */
  getAnalytics() {
    const summary = {
      totalEvents: this.metrics.eventsProcessed,
      threatsDetected: this.metrics.threatsDetected,
      alertsTriggered: this.metrics.alertsTriggered,
      threatDetectionRate: this.metrics.eventsProcessed > 0
        ? (this.metrics.threatsDetected / this.metrics.eventsProcessed * 100).toFixed(2) + '%'
        : '0%',
      avgProcessingTime: this.metrics.eventsProcessed > 0
        ? (this.metrics.processingTimeMs / this.metrics.eventsProcessed).toFixed(2) + 'ms'
        : '0ms',
      uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000) + 's',
      activeSources: this.rateTracker.size,
      eventHistory: Array.from(this.eventHistory.keys()).length + ' time periods'
    };

    return summary;
  }

  /**
   * Shutdown monitoring
   */
  shutdown() {
    if (this.rateLimitInterval) {
      clearInterval(this.rateLimitInterval);
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.emit('monitor:shutdown', {
      timestamp: new Date().toISOString(),
      finalMetrics: this.getAnalytics()
    });
  }
}

/**
 * Global security monitor instance
 */
let globalMonitor = null;

/**
 * Get or create global security monitor
 * @param {Object} options - Monitor options
 * @returns {SecurityMonitor} Global monitor instance
 */
export function getSecurityMonitor(options = {}) {
  if (!globalMonitor) {
    globalMonitor = new SecurityMonitor(options);
  }
  return globalMonitor;
}

/**
 * Monitor CLI security event
 * @param {Object} event - CLI security event
 * @returns {Object} Security analysis
 */
export function monitorCLIEvent(event) {
  const monitor = getSecurityMonitor();
  return monitor.processSecurityEvent({
    source: 'CLI',
    type: 'command',
    ...event
  });
}

/**
 * Monitor template security event
 * @param {Object} event - Template security event
 * @returns {Object} Security analysis
 */
export function monitorTemplateEvent(event) {
  const monitor = getSecurityMonitor();
  return monitor.processSecurityEvent({
    source: 'TEMPLATE',
    type: 'template_processing',
    ...event
  });
}

/**
 * Monitor agent security event
 * @param {Object} event - Agent security event
 * @returns {Object} Security analysis
 */
export function monitorAgentEvent(event) {
  const monitor = getSecurityMonitor();
  return monitor.processSecurityEvent({
    source: 'AGENT',
    type: 'agent_communication',
    ...event
  });
}

export default SecurityMonitor;