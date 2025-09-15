/**
 * @fileoverview Territory C - Complexity Analyzer
 * @description Analyzes cyclomatic complexity for function quality evaluation
 */

/**
 * Complexity Analyzer
 * Provides detailed cyclomatic complexity analysis for function evaluation
 */
export class ComplexityAnalyzer {
  constructor() {
    this.complexityThresholds = {
      low: 5,
      moderate: 10,
      high: 15,
      veryHigh: 20,
    };
  }

  /**
   * Calculate cyclomatic complexity for a function
   * @param {string} functionCode - The function code to analyze
   * @returns {Object} Complexity analysis results
   */
  analyzeCyclomaticComplexity(functionCode) {
    const decisionPoints = this._countDecisionPoints(functionCode);
    const complexity = 1 + decisionPoints; // Base complexity + decision points

    return {
      complexity,
      decisionPoints,
      level: this._getComplexityLevel(complexity),
      recommendation: this._getComplexityRecommendation(complexity),
      breakdown: this._getComplexityBreakdown(functionCode),
      metrics: this._calculateMetrics(functionCode, complexity),
    };
  }

  /**
   * Count decision points in the code
   * @private
   * @param {string} code - Code to analyze
   * @returns {number} Number of decision points
   */
  _countDecisionPoints(code) {
    const patterns = [
      { name: "if", pattern: /\bif\s*\(/g },
      { name: "else if", pattern: /\belse\s+if\s*\(/g },
      { name: "while", pattern: /\bwhile\s*\(/g },
      { name: "for", pattern: /\bfor\s*\(/g },
      { name: "do-while", pattern: /\bdo\s*{[\s\S]*?}\s*while\s*\(/g },
      { name: "switch", pattern: /\bswitch\s*\(/g },
      { name: "case", pattern: /\bcase\s+/g },
      { name: "catch", pattern: /\bcatch\s*\(/g },
      { name: "ternary", pattern: /\?[^:]*:/g },
      { name: "logical and", pattern: /&&/g },
      { name: "logical or", pattern: /\|\|/g },
      { name: "nullish coalescing", pattern: /\?\?/g },
    ];

    let totalDecisionPoints = 0;
    const breakdown = {};

    patterns.forEach(({ name, pattern }) => {
      const matches = code.match(pattern) || [];
      const count = matches.length;
      breakdown[name] = count;
      totalDecisionPoints += count;
    });

    return totalDecisionPoints;
  }

  /**
   * Get complexity level description
   * @private
   * @param {number} complexity - Complexity score
   * @returns {string} Complexity level
   */
  _getComplexityLevel(complexity) {
    if (complexity <= this.complexityThresholds.low) return "low";
    if (complexity <= this.complexityThresholds.moderate) return "moderate";
    if (complexity <= this.complexityThresholds.high) return "high";
    return "very high";
  }

  /**
   * Get recommendation based on complexity
   * @private
   * @param {number} complexity - Complexity score
   * @returns {string} Recommendation text
   */
  _getComplexityRecommendation(complexity) {
    const level = this._getComplexityLevel(complexity);

    switch (level) {
      case "low":
        return "Good complexity level. Function is easy to understand and test.";
      case "moderate":
        return "Acceptable complexity. Consider reviewing for potential simplifications.";
      case "high":
        return "High complexity detected. Consider breaking into smaller functions.";
      case "very high":
        return "Very high complexity. Refactoring strongly recommended for maintainability.";
      default:
        return "Unable to determine complexity recommendation.";
    }
  }

  /**
   * Get detailed breakdown of complexity sources
   * @private
   * @param {string} code - Code to analyze
   * @returns {Object} Detailed breakdown
   */
  _getComplexityBreakdown(code) {
    const patterns = [
      { name: "if statements", pattern: /\bif\s*\(/g },
      { name: "else if statements", pattern: /\belse\s+if\s*\(/g },
      { name: "loops", pattern: /\b(while|for)\s*\(/g },
      { name: "switch statements", pattern: /\bswitch\s*\(/g },
      { name: "case clauses", pattern: /\bcase\s+/g },
      { name: "try-catch blocks", pattern: /\bcatch\s*\(/g },
      { name: "ternary operators", pattern: /\?[^:]*:/g },
      { name: "logical operators", pattern: /(&&|\|\|)/g },
      { name: "nullish coalescing", pattern: /\?\?/g },
    ];

    const breakdown = {};
    patterns.forEach(({ name, pattern }) => {
      const matches = code.match(pattern) || [];
      if (matches.length > 0) {
        breakdown[name] = matches.length;
      }
    });

    return breakdown;
  }

  /**
   * Calculate additional complexity metrics
   * @private
   * @param {string} code - Code to analyze
   * @param {number} complexity - Base complexity
   * @returns {Object} Additional metrics
   */
  _calculateMetrics(code, complexity) {
    const lines = code.split("\n").filter((line) => line.trim().length > 0);
    const totalLines = lines.length;
    const nestingLevel = this._calculateNestingLevel(code);
    const functionCalls = this._countFunctionCalls(code);

    return {
      totalLines,
      complexityPerLine:
        totalLines > 0 ? (complexity / totalLines).toFixed(2) : 0,
      nestingLevel,
      functionCalls,
      maintainabilityIndex: this._calculateMaintainabilityIndex(
        complexity,
        totalLines,
        nestingLevel
      ),
    };
  }

  /**
   * Calculate maximum nesting level
   * @private
   * @param {string} code - Code to analyze
   * @returns {number} Maximum nesting level
   */
  _calculateNestingLevel(code) {
    let currentLevel = 0;
    let maxLevel = 0;

    for (const char of code) {
      if (char === "{") {
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (char === "}") {
        currentLevel--;
      }
    }

    return maxLevel;
  }

  /**
   * Count function calls in the code
   * @private
   * @param {string} code - Code to analyze
   * @returns {number} Number of function calls
   */
  _countFunctionCalls(code) {
    // Match function calls: word followed by parentheses
    const functionCallPattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/g;
    const matches = code.match(functionCallPattern) || [];
    return matches.length;
  }

  /**
   * Calculate maintainability index (simplified version)
   * @private
   * @param {number} complexity - Cyclomatic complexity
   * @param {number} lines - Lines of code
   * @param {number} nesting - Nesting level
   * @returns {number} Maintainability index (0-100)
   */
  _calculateMaintainabilityIndex(complexity, lines, nesting) {
    // Simplified maintainability index calculation
    // Higher values indicate better maintainability
    const complexityPenalty = complexity * 2;
    const linePenalty = lines * 0.5;
    const nestingPenalty = nesting * 5;

    const baseScore = 100;
    const penalties = complexityPenalty + linePenalty + nestingPenalty;

    return Math.max(0, Math.min(100, baseScore - penalties));
  }

  /**
   * Analyze nesting patterns in the code
   * @param {string} code - Code to analyze
   * @returns {Object} Nesting analysis
   */
  analyzeNesting(code) {
    const lines = code.split("\n");
    let currentIndent = 0;
    let maxIndent = 0;
    const indentHistory = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return;

      // Calculate indentation level (assuming 2 spaces or 1 tab = 1 level)
      const leadingSpaces = line.match(/^(\s*)/)[1];
      const indentLevel = leadingSpaces.replace(/\t/g, "  ").length / 2;

      indentHistory.push({
        line: index + 1,
        level: indentLevel,
        content: trimmed,
      });
      maxIndent = Math.max(maxIndent, indentLevel);
    });

    return {
      maxNestingLevel: maxIndent,
      averageNestingLevel:
        indentHistory.length > 0
          ? (
              indentHistory.reduce((sum, item) => sum + item.level, 0) /
              indentHistory.length
            ).toFixed(2)
          : 0,
      deeplyNestedLines: indentHistory.filter((item) => item.level >= 4),
      recommendation:
        maxIndent >= 4
          ? "Deep nesting detected. Consider extracting nested logic into separate functions."
          : "Acceptable nesting levels.",
    };
  }

  /**
   * Get complexity thresholds
   * @returns {Object} Complexity thresholds
   */
  getComplexityThresholds() {
    return { ...this.complexityThresholds };
  }

  /**
   * Update complexity thresholds
   * @param {Object} newThresholds - New threshold values
   */
  setComplexityThresholds(newThresholds) {
    this.complexityThresholds = {
      ...this.complexityThresholds,
      ...newThresholds,
    };
  }

  /**
   * Generate complexity report
   * @param {string} functionCode - Function code to analyze
   * @param {string} functionName - Name of the function
   * @returns {Object} Comprehensive complexity report
   */
  generateComplexityReport(functionCode, functionName = "anonymous") {
    const cyclomaticAnalysis = this.analyzeCyclomaticComplexity(functionCode);
    const nestingAnalysis = this.analyzeNesting(functionCode);

    return {
      functionName,
      timestamp: new Date().toISOString(),
      cyclomatic: cyclomaticAnalysis,
      nesting: nestingAnalysis,
      summary: {
        overallComplexity: cyclomaticAnalysis.level,
        recommendation: this._getOverallRecommendation(
          cyclomaticAnalysis,
          nestingAnalysis
        ),
        needsRefactoring:
          cyclomaticAnalysis.complexity > this.complexityThresholds.moderate ||
          nestingAnalysis.maxNestingLevel >= 4,
      },
    };
  }

  /**
   * Get overall recommendation based on all analyses
   * @private
   * @param {Object} cyclomaticAnalysis - Cyclomatic complexity analysis
   * @param {Object} nestingAnalysis - Nesting analysis
   * @returns {string} Overall recommendation
   */
  _getOverallRecommendation(cyclomaticAnalysis, nestingAnalysis) {
    const highComplexity =
      cyclomaticAnalysis.complexity > this.complexityThresholds.moderate;
    const deepNesting = nestingAnalysis.maxNestingLevel >= 4;

    if (highComplexity && deepNesting) {
      return "Function has both high complexity and deep nesting. Significant refactoring recommended.";
    } else if (highComplexity) {
      return "High cyclomatic complexity detected. Consider breaking into smaller functions.";
    } else if (deepNesting) {
      return "Deep nesting detected. Consider extracting nested logic into separate functions.";
    } else {
      return "Function complexity is within acceptable limits.";
    }
  }
}

/**
 * Default complexity analyzer instance
 */
export const complexityAnalyzer = new ComplexityAnalyzer();
