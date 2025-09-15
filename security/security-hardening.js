/**
 * Advanced Security Hardening System
 *
 * Implements enterprise-grade security hardening with multi-layer defense,
 * advanced attack vector protection, and security boundary validation.
 *
 * @module SecurityHardening
 * @version 1.0.0
 * @since 2025-09-14
 */

import { createHash, randomBytes } from 'crypto';
import { performance } from 'perf_hooks';
import chalk from 'chalk';
import { getSecurityMonitor } from './security-monitor.js';

/**
 * Security hardening levels
 */
export const HardeningLevel = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  ENHANCED: 'ENHANCED',
  ENTERPRISE: 'ENTERPRISE'
};

/**
 * Attack vector categories
 */
export const AttackVector = {
  INJECTION: 'INJECTION',
  XSS: 'XSS',
  CSRF: 'CSRF',
  PATH_TRAVERSAL: 'PATH_TRAVERSAL',
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  INFORMATION_DISCLOSURE: 'INFORMATION_DISCLOSURE',
  BRUTE_FORCE: 'BRUTE_FORCE',
  DOS: 'DOS'
};

/**
 * Advanced Security Hardening Engine
 */
export class SecurityHardening {
  constructor(options = {}) {
    this.options = {
      hardeningLevel: options.hardeningLevel || HardeningLevel.ENTERPRISE,
      enableAdvancedProtection: options.enableAdvancedProtection !== false,
      enableBehavioralAnalysis: options.enableBehavioralAnalysis !== false,
      enableMachineLearning: options.enableMachineLearning !== false,
      maxInputLength: options.maxInputLength || 1000,
      allowedCharsets: options.allowedCharsets || /^[a-zA-Z0-9\s\-_.@#()[\]{}:;,!?/\\]*$/,
      rateLimitStrict: options.rateLimitStrict || 10,
      sessionTimeout: options.sessionTimeout || 300000, // 5 minutes
      ...options
    };

    // Initialize hardening components
    this.monitor = getSecurityMonitor();
    this.protectionLayers = this.initializeProtectionLayers();
    this.behavioralBaseline = new Map();
    this.securityPolicies = this.initializeSecurityPolicies();
    this.sessionManager = new Map();

    // Security metrics
    this.metrics = {
      attacksBlocked: 0,
      layersTriggered: new Map(),
      falsePositives: 0,
      processingOverhead: 0,
      policyViolations: 0
    };

    this.startHardening();
  }

  /**
   * Initialize multi-layer protection system
   */
  initializeProtectionLayers() {
    return {
      // Layer 1: Input Validation & Sanitization
      inputValidation: {
        name: 'Input Validation',
        priority: 1,
        enabled: true,
        processor: this.processInputValidation.bind(this)
      },

      // Layer 2: Pattern Detection
      patternDetection: {
        name: 'Pattern Detection',
        priority: 2,
        enabled: true,
        processor: this.processPatternDetection.bind(this)
      },

      // Layer 3: Behavioral Analysis
      behavioralAnalysis: {
        name: 'Behavioral Analysis',
        priority: 3,
        enabled: this.options.enableBehavioralAnalysis,
        processor: this.processBehavioralAnalysis.bind(this)
      },

      // Layer 4: Context Analysis
      contextAnalysis: {
        name: 'Context Analysis',
        priority: 4,
        enabled: true,
        processor: this.processContextAnalysis.bind(this)
      },

      // Layer 5: Advanced Threat Detection
      threatDetection: {
        name: 'Advanced Threat Detection',
        priority: 5,
        enabled: this.options.enableAdvancedProtection,
        processor: this.processAdvancedThreatDetection.bind(this)
      },

      // Layer 6: Machine Learning Analysis
      mlAnalysis: {
        name: 'ML Analysis',
        priority: 6,
        enabled: this.options.enableMachineLearning,
        processor: this.processMLAnalysis.bind(this)
      }
    };
  }

  /**
   * Initialize security policies
   */
  initializeSecurityPolicies() {
    return {
      // Command execution policies
      commandExecution: {
        allowedCommands: new Set(['setup', 'dev-mode', 'verify', 'quick-start']),
        blockedPatterns: [
          /rm\s+-rf/gi,
          /format\s+c:/gi,
          /del\s+\/[fsq]/gi,
          /sudo\s+/gi,
          /chmod\s+777/gi,
          /wget|curl/gi,
          /nc\s+-l/gi
        ],
        maxLength: 100,
        requireWhitelist: true
      },

      // File access policies
      fileAccess: {
        allowedPaths: [
          '/Users/*/claude-mcp-workspace',
          '/Users/*/Library/Application Support/Claude'
        ],
        blockedPaths: [
          '/etc',
          '/var',
          '/tmp',
          '/System',
          '/Windows',
          '/proc'
        ],
        allowedExtensions: new Set(['.json', '.md', '.txt', '.js', '.ts']),
        maxFileSize: 10 * 1024 * 1024 // 10MB
      },

      // Network policies
      network: {
        allowedDomains: new Set([
          'github.com',
          'api.github.com',
          'search.brave.com',
          'api.tavily.com'
        ]),
        blockedDomains: new Set([
          'bit.ly',
          'tinyurl.com',
          't.co',
          'pastebin.com'
        ]),
        requireHttps: true,
        maxConnections: 5
      },

      // Template processing policies
      templateProcessing: {
        allowedTemplates: new Set(['markdown', 'json', 'text']),
        blockedPatterns: [
          /<script/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /\{\{[^}]*\}\}/g,
          /<\?[\s\S]*\?>/g
        ],
        maxTemplateSize: 100 * 1024, // 100KB
        requireEscaping: true
      }
    };
  }

  /**
   * Start hardening system
   */
  startHardening() {
    // Initialize all protection layers
    const enabledLayers = Object.values(this.protectionLayers)
      .filter(layer => layer.enabled)
      .length;

    console.log(
      chalk.green(`🛡️  Security Hardening System Active`),
      `\n${chalk.yellow('Level:')} ${this.options.hardeningLevel}`,
      `\n${chalk.yellow('Protection Layers:')} ${enabledLayers}`,
      `\n${chalk.yellow('Advanced Protection:')} ${this.options.enableAdvancedProtection ? 'ENABLED' : 'DISABLED'}`,
      `\n${chalk.yellow('Behavioral Analysis:')} ${this.options.enableBehavioralAnalysis ? 'ENABLED' : 'DISABLED'}`
    );

    // Start session cleanup
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupSessions();
    }, 60000); // Every minute
  }

  /**
   * Apply security hardening to input
   * @param {Object} request - Security request
   * @returns {Promise<Object>} Hardening results
   */
  async applyHardening(request) {
    const startTime = performance.now();
    const sessionId = this.getOrCreateSession(request);

    const hardeningResult = {
      sessionId,
      timestamp: new Date().toISOString(),
      input: request.input,
      source: request.source || 'unknown',
      allowed: true,
      blocked: false,
      violations: [],
      layersTriggered: [],
      confidence: 0,
      processingTimeMs: 0,
      recommendations: []
    };

    try {
      // Process through all enabled protection layers
      const sortedLayers = Object.entries(this.protectionLayers)
        .filter(([, layer]) => layer.enabled)
        .sort(([, a], [, b]) => a.priority - b.priority);

      for (const [layerName, layer] of sortedLayers) {
        const layerResult = await layer.processor(request, hardeningResult);

        hardeningResult.layersTriggered.push({
          layer: layerName,
          name: layer.name,
          result: layerResult.status,
          confidence: layerResult.confidence || 0,
          violations: layerResult.violations || []
        });

        // Update overall results
        hardeningResult.confidence = Math.max(hardeningResult.confidence, layerResult.confidence || 0);
        hardeningResult.violations.push(...(layerResult.violations || []));

        // Stop processing if high-confidence threat detected
        if (layerResult.confidence >= 0.9 && layerResult.status === 'BLOCK') {
          hardeningResult.blocked = true;
          hardeningResult.allowed = false;
          break;
        }

        // Update metrics
        const layerCount = this.metrics.layersTriggered.get(layerName) || 0;
        this.metrics.layersTriggered.set(layerName, layerCount + 1);
      }

      // Final decision based on cumulative analysis
      if (!hardeningResult.blocked && hardeningResult.confidence >= 0.7) {
        hardeningResult.blocked = true;
        hardeningResult.allowed = false;
        hardeningResult.recommendations.push('BLOCK - High confidence threat detected');
      } else if (hardeningResult.confidence >= 0.5) {
        hardeningResult.recommendations.push('MONITOR - Medium confidence threat detected');
      }

      // Update session data
      this.updateSession(sessionId, hardeningResult);

      // Record metrics
      hardeningResult.processingTimeMs = performance.now() - startTime;
      this.metrics.processingOverhead += hardeningResult.processingTimeMs;

      if (hardeningResult.blocked) {
        this.metrics.attacksBlocked++;
      }

      if (hardeningResult.violations.length > 0) {
        this.metrics.policyViolations += hardeningResult.violations.length;
      }

      // Monitor security event
      this.monitor.processSecurityEvent({
        source: request.source,
        type: 'hardening_analysis',
        input: request.input,
        result: hardeningResult
      });

      return hardeningResult;

    } catch (error) {
      hardeningResult.error = error.message;
      hardeningResult.blocked = true;
      hardeningResult.allowed = false;
      hardeningResult.processingTimeMs = performance.now() - startTime;

      console.error(chalk.red('🔥 Security Hardening Error:'), error.message);

      return hardeningResult;
    }
  }

  /**
   * Layer 1: Input Validation & Sanitization
   */
  async processInputValidation(request, context) {
    const result = {
      status: 'ALLOW',
      confidence: 0,
      violations: []
    };

    const input = request.input || '';

    // Length validation
    if (input.length > this.options.maxInputLength) {
      result.violations.push({
        type: 'INPUT_LENGTH_EXCEEDED',
        severity: 'HIGH',
        details: `Input length ${input.length} exceeds maximum ${this.options.maxInputLength}`
      });
      result.confidence += 0.6;
      result.status = 'BLOCK';
    }

    // Character set validation
    if (!this.options.allowedCharsets.test(input)) {
      result.violations.push({
        type: 'INVALID_CHARACTERS',
        severity: 'MEDIUM',
        details: 'Input contains invalid characters'
      });
      result.confidence += 0.4;
    }

    // Null byte detection
    if (input.includes('\0')) {
      result.violations.push({
        type: 'NULL_BYTE_INJECTION',
        severity: 'HIGH',
        details: 'Null byte detected in input'
      });
      result.confidence += 0.8;
      result.status = 'BLOCK';
    }

    // Unicode normalization attack detection
    if (input.normalize('NFD') !== input) {
      result.violations.push({
        type: 'UNICODE_NORMALIZATION_ATTACK',
        severity: 'MEDIUM',
        details: 'Potential Unicode normalization attack'
      });
      result.confidence += 0.5;
    }

    return result;
  }

  /**
   * Layer 2: Pattern Detection
   */
  async processPatternDetection(request, context) {
    const result = {
      status: 'ALLOW',
      confidence: 0,
      violations: []
    };

    const input = request.input || '';
    const source = request.source || 'unknown';

    // Apply relevant security policies
    if (source === 'CLI') {
      const cmdResult = this.validateCommandExecution(input);
      result.violations.push(...cmdResult.violations);
      result.confidence = Math.max(result.confidence, cmdResult.confidence);
    }

    if (source === 'TEMPLATE') {
      const templateResult = this.validateTemplateProcessing(input);
      result.violations.push(...templateResult.violations);
      result.confidence = Math.max(result.confidence, templateResult.confidence);
    }

    // Check for file access patterns
    const fileResult = this.validateFileAccess(input);
    result.violations.push(...fileResult.violations);
    result.confidence = Math.max(result.confidence, fileResult.confidence);

    // Determine status based on highest confidence violation
    if (result.confidence >= 0.8) {
      result.status = 'BLOCK';
    } else if (result.confidence >= 0.6) {
      result.status = 'ALERT';
    }

    return result;
  }

  /**
   * Layer 3: Behavioral Analysis
   */
  async processBehavioralAnalysis(request, context) {
    const result = {
      status: 'ALLOW',
      confidence: 0,
      violations: []
    };

    const source = request.source || 'unknown';
    const sessionId = context.sessionId;

    // Get session history
    const session = this.sessionManager.get(sessionId);
    if (!session) {
      return result;
    }

    // Analyze request frequency
    const recentRequests = session.requests.filter(
      req => Date.now() - req.timestamp < 60000 // Last minute
    );

    if (recentRequests.length > this.options.rateLimitStrict) {
      result.violations.push({
        type: 'RAPID_FIRE_REQUESTS',
        severity: 'HIGH',
        details: `${recentRequests.length} requests in last minute`
      });
      result.confidence += 0.7;
      result.status = 'BLOCK';
    }

    // Analyze pattern deviation
    const baseline = this.behavioralBaseline.get(source);
    if (baseline) {
      const currentPattern = this.extractBehavioralPattern(request);
      const deviation = this.calculatePatternDeviation(currentPattern, baseline);

      if (deviation > 0.8) {
        result.violations.push({
          type: 'BEHAVIORAL_ANOMALY',
          severity: 'MEDIUM',
          details: `Pattern deviation: ${(deviation * 100).toFixed(1)}%`
        });
        result.confidence += 0.5;
      }
    } else {
      // Establish baseline
      this.behavioralBaseline.set(source, this.extractBehavioralPattern(request));
    }

    return result;
  }

  /**
   * Layer 4: Context Analysis
   */
  async processContextAnalysis(request, context) {
    const result = {
      status: 'ALLOW',
      confidence: 0,
      violations: []
    };

    const input = request.input || '';
    const source = request.source || 'unknown';

    // Analyze context switching attempts
    if (this.detectContextSwitching(input)) {
      result.violations.push({
        type: 'CONTEXT_SWITCHING_ATTACK',
        severity: 'HIGH',
        details: 'Attempt to switch execution context detected'
      });
      result.confidence += 0.8;
      result.status = 'BLOCK';
    }

    // Analyze privilege escalation attempts
    if (this.detectPrivilegeEscalation(input)) {
      result.violations.push({
        type: 'PRIVILEGE_ESCALATION_ATTEMPT',
        severity: 'CRITICAL',
        details: 'Privilege escalation pattern detected'
      });
      result.confidence += 0.9;
      result.status = 'BLOCK';
    }

    // Analyze information disclosure attempts
    if (this.detectInformationDisclosure(input)) {
      result.violations.push({
        type: 'INFORMATION_DISCLOSURE_ATTEMPT',
        severity: 'HIGH',
        details: 'Attempt to access sensitive information'
      });
      result.confidence += 0.7;
    }

    return result;
  }

  /**
   * Layer 5: Advanced Threat Detection
   */
  async processAdvancedThreatDetection(request, context) {
    const result = {
      status: 'ALLOW',
      confidence: 0,
      violations: []
    };

    const input = request.input || '';

    // Advanced injection detection
    const injectionConfidence = this.detectAdvancedInjection(input);
    if (injectionConfidence > 0.6) {
      result.violations.push({
        type: 'ADVANCED_INJECTION_ATTACK',
        severity: 'HIGH',
        details: `Advanced injection pattern detected (confidence: ${(injectionConfidence * 100).toFixed(1)}%)`
      });
      result.confidence += injectionConfidence;
    }

    // Polyglot attack detection
    if (this.detectPolyglotAttack(input)) {
      result.violations.push({
        type: 'POLYGLOT_ATTACK',
        severity: 'HIGH',
        details: 'Multi-language injection attempt detected'
      });
      result.confidence += 0.8;
      result.status = 'BLOCK';
    }

    // Evasion technique detection
    const evasionConfidence = this.detectEvasionTechniques(input);
    if (evasionConfidence > 0.5) {
      result.violations.push({
        type: 'EVASION_TECHNIQUE',
        severity: 'MEDIUM',
        details: 'Security evasion technique detected'
      });
      result.confidence += evasionConfidence;
    }

    return result;
  }

  /**
   * Layer 6: Machine Learning Analysis
   */
  async processMLAnalysis(request, context) {
    const result = {
      status: 'ALLOW',
      confidence: 0,
      violations: []
    };

    // Simplified ML-style analysis based on feature extraction
    const features = this.extractSecurityFeatures(request.input || '');
    const threatScore = this.calculateThreatScore(features);

    if (threatScore > 0.8) {
      result.violations.push({
        type: 'ML_THREAT_DETECTION',
        severity: 'HIGH',
        details: `ML threat score: ${(threatScore * 100).toFixed(1)}%`
      });
      result.confidence = threatScore;
      result.status = 'BLOCK';
    } else if (threatScore > 0.6) {
      result.violations.push({
        type: 'ML_SUSPICIOUS_PATTERN',
        severity: 'MEDIUM',
        details: `ML suspicious score: ${(threatScore * 100).toFixed(1)}%`
      });
      result.confidence = threatScore;
    }

    return result;
  }

  /**
   * Validate command execution against policy
   */
  validateCommandExecution(input) {
    const policy = this.securityPolicies.commandExecution;
    const result = { violations: [], confidence: 0 };

    // Check against blocked patterns
    for (const pattern of policy.blockedPatterns) {
      if (pattern.test(input)) {
        result.violations.push({
          type: 'BLOCKED_COMMAND_PATTERN',
          severity: 'HIGH',
          details: `Matches blocked pattern: ${pattern.source}`
        });
        result.confidence += 0.8;
      }
    }

    // Check length
    if (input.length > policy.maxLength) {
      result.violations.push({
        type: 'COMMAND_LENGTH_EXCEEDED',
        severity: 'MEDIUM',
        details: `Command length ${input.length} exceeds maximum ${policy.maxLength}`
      });
      result.confidence += 0.4;
    }

    return result;
  }

  /**
   * Validate template processing against policy
   */
  validateTemplateProcessing(input) {
    const policy = this.securityPolicies.templateProcessing;
    const result = { violations: [], confidence: 0 };

    // Check against blocked patterns
    for (const pattern of policy.blockedPatterns) {
      if (pattern.test(input)) {
        result.violations.push({
          type: 'TEMPLATE_INJECTION_PATTERN',
          severity: 'HIGH',
          details: `Template injection pattern detected: ${pattern.source}`
        });
        result.confidence += 0.9;
      }
    }

    // Check size
    if (input.length > policy.maxTemplateSize) {
      result.violations.push({
        type: 'TEMPLATE_SIZE_EXCEEDED',
        severity: 'MEDIUM',
        details: `Template size ${input.length} exceeds maximum ${policy.maxTemplateSize}`
      });
      result.confidence += 0.3;
    }

    return result;
  }

  /**
   * Validate file access patterns
   */
  validateFileAccess(input) {
    const policy = this.securityPolicies.fileAccess;
    const result = { violations: [], confidence: 0 };

    // Check for blocked paths
    for (const blockedPath of policy.blockedPaths) {
      if (input.includes(blockedPath)) {
        result.violations.push({
          type: 'BLOCKED_PATH_ACCESS',
          severity: 'HIGH',
          details: `Attempt to access blocked path: ${blockedPath}`
        });
        result.confidence += 0.8;
      }
    }

    return result;
  }

  /**
   * Detect context switching attacks
   */
  detectContextSwitching(input) {
    const contextSwitchPatterns = [
      /break\s+out/gi,
      /escape\s+context/gi,
      /switch\s+mode/gi,
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi
    ];

    return contextSwitchPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect privilege escalation attempts
   */
  detectPrivilegeEscalation(input) {
    const escalationPatterns = [
      /sudo\s+/gi,
      /su\s+-/gi,
      /runas\s+/gi,
      /chmod\s+777/gi,
      /setuid/gi,
      /admin\s+rights/gi,
      /elevation/gi
    ];

    return escalationPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect information disclosure attempts
   */
  detectInformationDisclosure(input) {
    const disclosurePatterns = [
      /\/etc\/passwd/gi,
      /\/etc\/shadow/gi,
      /\.bash_history/gi,
      /\.ssh\/id_rsa/gi,
      /config\.json/gi,
      /password/gi,
      /api[_-]?key/gi,
      /secret/gi,
      /token/gi
    ];

    return disclosurePatterns.some(pattern => pattern.test(input));
  }

  /**
   * Detect advanced injection attacks
   */
  detectAdvancedInjection(input) {
    let confidence = 0;

    // Time-based injection patterns
    if (/sleep\s*\(\s*\d+\s*\)|benchmark\s*\(/gi.test(input)) {
      confidence += 0.7;
    }

    // Blind injection patterns
    if (/\bif\s*\(.+?\)\s*\{|\bcase\s+when\b/gi.test(input)) {
      confidence += 0.6;
    }

    // Second-order injection patterns
    if (/insert\s+into.*select|union\s+select/gi.test(input)) {
      confidence += 0.8;
    }

    // NoSQL injection patterns
    if (/\$where\s*:|ne\s*:|regex\s*:/gi.test(input)) {
      confidence += 0.7;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect polyglot attacks
   */
  detectPolyglotAttack(input) {
    // Check for multiple language patterns in single input
    const patterns = {
      sql: /select\s+.*from|union\s+select|drop\s+table/gi,
      javascript: /<script|javascript:|eval\s*\(/gi,
      php: /<\?php|<\?\s/gi,
      xml: /<!\[CDATA\[|<\?xml/gi,
      ldap: /\(\|\(|\)\)\(/gi,
      xpath: /\[\s*position\s*\(\s*\)\s*=|\/\/\*\[/gi
    };

    const matchedPatterns = Object.keys(patterns).filter(
      lang => patterns[lang].test(input)
    );

    return matchedPatterns.length >= 2;
  }

  /**
   * Detect evasion techniques
   */
  detectEvasionTechniques(input) {
    let confidence = 0;

    // Encoding evasion
    if (/%[0-9a-f]{2}|\\x[0-9a-f]{2}|\\u[0-9a-f]{4}/gi.test(input)) {
      confidence += 0.4;
    }

    // Comment evasion
    if (/\/\*.*?\*\/|--\s|#.*$/gm.test(input)) {
      confidence += 0.3;
    }

    // Whitespace evasion
    if (/\s{5,}|\t{3,}|\r\n{3,}/g.test(input)) {
      confidence += 0.2;
    }

    // Case manipulation
    if (/[A-Z]{3,}.*[a-z]{3,}.*[A-Z]{3,}/g.test(input)) {
      confidence += 0.3;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract security features for ML analysis
   */
  extractSecurityFeatures(input) {
    return {
      length: input.length,
      specialCharCount: (input.match(/[^a-zA-Z0-9\s]/g) || []).length,
      uppercaseRatio: (input.match(/[A-Z]/g) || []).length / input.length,
      digitRatio: (input.match(/\d/g) || []).length / input.length,
      whitespaceRatio: (input.match(/\s/g) || []).length / input.length,
      suspiciousKeywords: this.countSuspiciousKeywords(input),
      encodingAttempts: (input.match(/%[0-9a-f]{2}/gi) || []).length,
      sqlPatterns: (input.match(/select|union|drop|insert|update|delete/gi) || []).length,
      scriptPatterns: (input.match(/<script|javascript:|eval/gi) || []).length,
      pathPatterns: (input.match(/\.\.\/|\.\.\\|\.\.\%2f/gi) || []).length
    };
  }

  /**
   * Count suspicious keywords
   */
  countSuspiciousKeywords(input) {
    const suspiciousWords = [
      'password', 'secret', 'token', 'key', 'admin', 'root', 'sudo',
      'exec', 'eval', 'system', 'shell', 'cmd', 'bash', 'powershell'
    ];

    return suspiciousWords.filter(word =>
      new RegExp(`\\b${word}\\b`, 'gi').test(input)
    ).length;
  }

  /**
   * Calculate threat score using weighted features
   */
  calculateThreatScore(features) {
    const weights = {
      specialCharCount: 0.02,
      suspiciousKeywords: 0.15,
      encodingAttempts: 0.10,
      sqlPatterns: 0.20,
      scriptPatterns: 0.25,
      pathPatterns: 0.18,
      length: 0.001
    };

    let score = 0;
    for (const [feature, value] of Object.entries(features)) {
      if (weights[feature]) {
        score += Math.min(value * weights[feature], weights[feature] * 10);
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Extract behavioral pattern from request
   */
  extractBehavioralPattern(request) {
    const input = request.input || '';
    return {
      length: input.length,
      complexity: this.calculateComplexity(input),
      timestamp: Date.now(),
      source: request.source
    };
  }

  /**
   * Calculate pattern deviation
   */
  calculatePatternDeviation(current, baseline) {
    const lengthDiff = Math.abs(current.length - baseline.length) / Math.max(current.length, baseline.length);
    const complexityDiff = Math.abs(current.complexity - baseline.complexity);

    return (lengthDiff + complexityDiff) / 2;
  }

  /**
   * Calculate input complexity
   */
  calculateComplexity(input) {
    const uniqueChars = new Set(input).size;
    const totalChars = input.length;
    return totalChars > 0 ? uniqueChars / totalChars : 0;
  }

  /**
   * Get or create session
   */
  getOrCreateSession(request) {
    const sourceHash = createHash('sha256')
      .update(request.source || 'unknown')
      .digest('hex')
      .substring(0, 16);

    if (!this.sessionManager.has(sourceHash)) {
      this.sessionManager.set(sourceHash, {
        id: sourceHash,
        created: Date.now(),
        lastAccess: Date.now(),
        requests: [],
        violations: 0,
        blocked: 0
      });
    }

    return sourceHash;
  }

  /**
   * Update session data
   */
  updateSession(sessionId, result) {
    const session = this.sessionManager.get(sessionId);
    if (!session) return;

    session.lastAccess = Date.now();
    session.requests.push({
      timestamp: Date.now(),
      input: result.input,
      blocked: result.blocked,
      violations: result.violations.length
    });

    if (result.blocked) {
      session.blocked++;
    }

    session.violations += result.violations.length;

    // Limit session history
    if (session.requests.length > 100) {
      session.requests = session.requests.slice(-50);
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupSessions() {
    const now = Date.now();
    const expired = [];

    for (const [sessionId, session] of this.sessionManager.entries()) {
      if (now - session.lastAccess > this.options.sessionTimeout) {
        expired.push(sessionId);
      }
    }

    expired.forEach(sessionId => this.sessionManager.delete(sessionId));

    if (expired.length > 0) {
      console.log(chalk.gray(`🧹 Cleaned up ${expired.length} expired security sessions`));
    }
  }

  /**
   * Get hardening metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessionManager.size,
      avgProcessingTime: this.metrics.processingOverhead / Math.max(this.metrics.attacksBlocked + this.metrics.policyViolations, 1),
      layersTriggered: Object.fromEntries(this.metrics.layersTriggered),
      protectionLayers: Object.keys(this.protectionLayers).filter(
        key => this.protectionLayers[key].enabled
      ).length
    };
  }

  /**
   * Shutdown hardening system
   */
  shutdown() {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
    }

    console.log(
      chalk.yellow('🛡️  Security Hardening System Shutdown'),
      `\nAttacks Blocked: ${this.metrics.attacksBlocked}`,
      `\nPolicy Violations: ${this.metrics.policyViolations}`,
      `\nActive Sessions: ${this.sessionManager.size}`
    );
  }
}

/**
 * Global hardening instance
 */
let globalHardening = null;

/**
 * Get or create global security hardening
 * @param {Object} options - Hardening options
 * @returns {SecurityHardening} Global hardening instance
 */
export function getSecurityHardening(options = {}) {
  if (!globalHardening) {
    globalHardening = new SecurityHardening(options);
  }
  return globalHardening;
}

/**
 * Apply security hardening to CLI input
 * @param {Object} input - CLI input data
 * @returns {Promise<Object>} Hardening results
 */
export async function hardenCLIInput(input) {
  const hardening = getSecurityHardening();
  return await hardening.applyHardening({
    source: 'CLI',
    input: input.command || input.input,
    context: input.context || {}
  });
}

/**
 * Apply security hardening to template processing
 * @param {Object} input - Template input data
 * @returns {Promise<Object>} Hardening results
 */
export async function hardenTemplateInput(input) {
  const hardening = getSecurityHardening();
  return await hardening.applyHardening({
    source: 'TEMPLATE',
    input: input.template || input.input,
    context: input.context || {}
  });
}

/**
 * Apply security hardening to agent communication
 * @param {Object} input - Agent input data
 * @returns {Promise<Object>} Hardening results
 */
export async function hardenAgentInput(input) {
  const hardening = getSecurityHardening();
  return await hardening.applyHardening({
    source: 'AGENT',
    input: input.message || input.input,
    context: input.context || {}
  });
}

export default SecurityHardening;