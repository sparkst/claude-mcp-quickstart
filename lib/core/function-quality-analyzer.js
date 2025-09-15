/**
 * @fileoverview Territory C - Function Quality Analyzer
 * @description Implements 8-point function evaluation checklist for REQ-106
 */

/**
 * Function Quality Analyzer
 * Evaluates functions using the 8-point quality checklist
 */
export class FunctionQualityAnalyzer {
  constructor() {
    this.checklist = this._initializeChecklist();
    this.refactoringRules = this._initializeRefactoringRules();
  }

  /**
   * Initialize the 8-point function evaluation checklist
   * @private
   * @returns {Array} Checklist items
   */
  _initializeChecklist() {
    return [
      {
        id: 1,
        name: "readability",
        question:
          "Can you read the function and HONESTLY easily follow what it's doing?",
        stopCondition: true, // If yes, stop here
        category: "clarity",
      },
      {
        id: 2,
        name: "cyclomatic complexity",
        question: "Does the function have very high cyclomatic complexity?",
        description:
          "Number of independent paths, or nesting of if-else as a proxy",
        category: "complexity",
      },
      {
        id: 3,
        name: "data structures",
        question:
          "Are there any common data structures and algorithms that would make this function much easier to follow and more robust?",
        description: "Parsers, trees, stacks/queues, etc.",
        category: "algorithms",
      },
      {
        id: 4,
        name: "unused parameters",
        question: "Are there any unused parameters in the function?",
        category: "cleanliness",
      },
      {
        id: 5,
        name: "type casts",
        question:
          "Are there any unnecessary type casts that can be moved to function arguments?",
        category: "types",
      },
      {
        id: 6,
        name: "testability",
        question:
          "Is the function easily testable without mocking core features (e.g. sql queries, redis, etc.)?",
        description:
          "If not, can this function be tested as part of an integration test?",
        category: "testing",
      },
      {
        id: 7,
        name: "dependencies",
        question:
          "Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead?",
        description:
          "Only care about non-trivial dependencies that can actually change or affect the function",
        category: "dependencies",
      },
      {
        id: 8,
        name: "naming",
        question:
          "Brainstorm 3 better function names and see if the current name is the best, consistent with rest of codebase",
        category: "naming",
      },
    ];
  }

  /**
   * Initialize refactoring rules and anti-patterns
   * @private
   * @returns {Object} Refactoring rules
   */
  _initializeRefactoringRules() {
    return {
      compellingReasons: [
        "the refactored function is used in more than one place",
        "the refactored function is easily unit testable while the original function is not AND you can't test it any other way",
        "the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it",
      ],
      antiPatterns: [
        "Do not refactor unless there is a compelling need",
        "Avoid creating single-use functions",
        "Do not extract functions just for the sake of extraction",
      ],
    };
  }

  /**
   * Evaluate a function using the 8-point checklist
   * @param {string} functionCode - The function code to evaluate
   * @param {string} functionName - Name of the function
   * @param {Object} context - Additional context (codebase, dependencies, etc.)
   * @returns {Object} Evaluation results
   */
  evaluateFunction(functionCode, functionName, context = {}) {
    const results = {
      functionName,
      score: 0,
      maxScore: this.checklist.length,
      issues: [],
      recommendations: [],
      shouldRefactor: false,
      refactoringReasons: [],
    };

    // Run through each checklist item
    for (const item of this.checklist) {
      const evaluation = this._evaluateChecklistItem(
        item,
        functionCode,
        functionName,
        context
      );

      if (evaluation.passed) {
        results.score++;
      } else {
        results.issues.push({
          id: item.id,
          name: item.name,
          question: item.question,
          severity: evaluation.severity || "medium",
          recommendation: evaluation.recommendation,
        });
      }

      if (evaluation.recommendation) {
        results.recommendations.push(evaluation.recommendation);
      }

      // Stop condition for readability (item 1)
      if (item.stopCondition && evaluation.passed) {
        results.score = this.checklist.length; // Full score if readable
        results.readabilityStop = true;
        break;
      }
    }

    // Evaluate refactoring necessity
    results.refactoringAnalysis = this._evaluateRefactoringNeed(
      results,
      functionCode,
      context
    );

    return results;
  }

  /**
   * Evaluate a single checklist item
   * @private
   * @param {Object} item - Checklist item
   * @param {string} functionCode - Function code
   * @param {string} functionName - Function name
   * @param {Object} context - Evaluation context
   * @returns {Object} Item evaluation result
   */
  _evaluateChecklistItem(item, functionCode, functionName, context) {
    switch (item.id) {
      case 1: // Readability
        return this._evaluateReadability(functionCode);
      case 2: // Cyclomatic complexity
        return this._evaluateCyclomaticComplexity(functionCode);
      case 3: // Data structures
        return this._evaluateDataStructures(functionCode);
      case 4: // Unused parameters
        return this._evaluateUnusedParameters(functionCode);
      case 5: // Type casts
        return this._evaluateTypeCasts(functionCode);
      case 6: // Testability
        return this._evaluateTestability(functionCode, context);
      case 7: // Dependencies
        return this._evaluateDependencies(functionCode, context);
      case 8: // Naming
        return this._evaluateNaming(functionName, context);
      default:
        return { passed: false, recommendation: "Unknown checklist item" };
    }
  }

  /**
   * Evaluate function readability
   * @private
   */
  _evaluateReadability(functionCode) {
    const lines = functionCode
      .split("\n")
      .filter((line) => line.trim().length > 0);
    const length = lines.length;

    // Simple heuristics for readability
    const tooLong = length > 50;
    const deeplyNested = /\s{8,}/.test(functionCode); // 8+ spaces indicating deep nesting

    if (tooLong || deeplyNested) {
      return {
        passed: false,
        severity: "high",
        recommendation:
          "Function is too long or deeply nested, consider breaking into smaller functions",
      };
    }

    return { passed: true };
  }

  /**
   * Evaluate cyclomatic complexity
   * @private
   */
  _evaluateCyclomaticComplexity(functionCode) {
    // Count decision points: if, else, while, for, switch, case, catch, &&, ||
    const patterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /&&/g,
      /\|\|/g,
    ];

    let complexity = 1; // Base complexity
    patterns.forEach((pattern) => {
      const matches = functionCode.match(pattern);
      if (matches) complexity += matches.length;
    });

    const isHighComplexity = complexity > 10;

    return {
      passed: !isHighComplexity,
      severity: isHighComplexity ? "high" : "low",
      recommendation: isHighComplexity
        ? `High cyclomatic complexity (${complexity}). Consider breaking into smaller functions.`
        : undefined,
      metrics: { complexity },
    };
  }

  /**
   * Evaluate data structures usage
   * @private
   */
  _evaluateDataStructures(functionCode) {
    // Look for potential improvements with data structures
    const hasLoops = /\b(for|while)\b/.test(functionCode);
    const hasArrayOperations = /\.(map|filter|reduce|find)/.test(functionCode);
    const hasComplexLogic = functionCode.split("\n").length > 20;

    if (hasLoops && !hasArrayOperations && hasComplexLogic) {
      return {
        passed: false,
        recommendation:
          "Consider using higher-order array methods (map, filter, reduce) for cleaner code",
      };
    }

    return { passed: true };
  }

  /**
   * Evaluate unused parameters
   * @private
   */
  _evaluateUnusedParameters(functionCode) {
    // Extract function signature and check parameter usage
    const functionMatch = functionCode.match(
      /function\s+\w*\s*\(([^)]*)\)|^\s*\(([^)]*)\)\s*=>/
    );
    if (!functionMatch) return { passed: true };

    const params = (functionMatch[1] || functionMatch[2] || "")
      .split(",")
      .map((p) => p.trim().split(/[=\s]/)[0])
      .filter((p) => p && p !== "...");

    const unusedParams = params.filter((param) => {
      if (param.startsWith("_")) return false; // Intentionally unused
      const paramRegex = new RegExp(`\\b${param}\\b`, "g");
      const matches = functionCode.match(paramRegex);
      return !matches || matches.length <= 1; // Only appears in signature
    });

    return {
      passed: unusedParams.length === 0,
      recommendation:
        unusedParams.length > 0
          ? `Remove unused parameters: ${unusedParams.join(", ")}`
          : undefined,
      metrics: { unusedParams },
    };
  }

  /**
   * Evaluate type casts
   * @private
   */
  _evaluateTypeCasts(functionCode) {
    // Look for unnecessary type casting patterns
    const castPatterns = [
      /as\s+\w+/g, // TypeScript 'as' casting
      /\<\w+\>/g, // Generic casting
      /Number\(/g,
      /String\(/g,
      /Boolean\(/g,
    ];

    let unnecessaryCasts = 0;
    castPatterns.forEach((pattern) => {
      const matches = functionCode.match(pattern);
      if (matches) unnecessaryCasts += matches.length;
    });

    return {
      passed: unnecessaryCasts === 0,
      recommendation:
        unnecessaryCasts > 0
          ? "Consider moving type casts to function parameters or using better typing"
          : undefined,
      metrics: { unnecessaryCasts },
    };
  }

  /**
   * Evaluate testability
   * @private
   */
  _evaluateTestability(functionCode, context) {
    // Check for hard-to-test patterns
    const hardToTestPatterns = [
      /console\./,
      /process\.exit/,
      /Date\.now\(\)/,
      /Math\.random\(\)/,
      /localStorage/,
      /sessionStorage/,
      /document\./,
      /window\./,
    ];

    const hasHardToTestCode = hardToTestPatterns.some((pattern) =>
      pattern.test(functionCode)
    );

    return {
      passed: !hasHardToTestCode,
      recommendation: hasHardToTestCode
        ? "Function has hard-to-test dependencies. Consider dependency injection or integration tests."
        : undefined,
    };
  }

  /**
   * Evaluate hidden dependencies
   * @private
   */
  _evaluateDependencies(functionCode, context) {
    // Look for external dependencies that aren't parameters
    const externalRefs = functionCode.match(/\b[A-Z][a-zA-Z]*\./g) || [];
    const globalVars = functionCode.match(/\bglobal\./g) || [];

    const hasHiddenDeps = externalRefs.length > 0 || globalVars.length > 0;

    return {
      passed: !hasHiddenDeps,
      recommendation: hasHiddenDeps
        ? "Consider passing external dependencies as parameters for better testability"
        : undefined,
      metrics: {
        externalRefs: externalRefs.length,
        globalVars: globalVars.length,
      },
    };
  }

  /**
   * Evaluate function naming
   * @private
   */
  _evaluateNaming(functionName, context) {
    // Basic naming checks
    const isDescriptive = functionName.length >= 4;
    const followsConvention = /^[a-z][a-zA-Z0-9]*$/.test(functionName);
    const avoidsBadWords = !/^(data|info|handle|process|manage)$/.test(
      functionName
    );

    const suggestions = [
      `${functionName}Handler`,
      `process${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`,
      `create${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`,
    ];

    const passed = isDescriptive && followsConvention && avoidsBadWords;

    return {
      passed,
      recommendation: !passed
        ? `Consider more descriptive naming. Suggestions: ${suggestions.join(", ")}`
        : undefined,
      metrics: { suggestions },
    };
  }

  /**
   * Evaluate if refactoring is needed
   * @private
   */
  _evaluateRefactoringNeed(results, functionCode, context) {
    const reasons = [];
    const score = results.score / results.maxScore;

    // Low score indicates refactoring need
    if (score < 0.6) {
      reasons.push("Function fails multiple quality checks");
    }

    // Check compelling reasons from rules
    if (context.usageCount > 1) {
      reasons.push("Function is used in multiple places");
    }

    if (
      results.issues.some(
        (issue) => issue.name === "testability" && issue.severity === "high"
      )
    ) {
      reasons.push(
        "Function has testability issues that could be resolved by extraction"
      );
    }

    if (
      results.readabilityStop === false &&
      results.issues.some((issue) => issue.name === "readability")
    ) {
      reasons.push("Function is extremely hard to follow");
    }

    return {
      shouldRefactor: reasons.length > 0,
      reasons,
      compellingReasons: this.refactoringRules.compellingReasons,
      antiPatterns: this.refactoringRules.antiPatterns,
    };
  }

  /**
   * Get the complete 8-point checklist
   * @returns {Array} The checklist items
   */
  getChecklist() {
    return [...this.checklist];
  }

  /**
   * Get refactoring rules
   * @returns {Object} Refactoring rules and anti-patterns
   */
  getRefactoringRules() {
    return { ...this.refactoringRules };
  }

  /**
   * Validate function against best practices
   * @param {string} functionCode - Function code to validate
   * @param {string} functionName - Function name
   * @param {Object} context - Additional context
   * @returns {Object} Validation summary
   */
  validateBestPractices(functionCode, functionName, context = {}) {
    const evaluation = this.evaluateFunction(
      functionCode,
      functionName,
      context
    );

    return {
      isValid: evaluation.score >= evaluation.maxScore * 0.8, // 80% threshold
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      percentage: Math.round((evaluation.score / evaluation.maxScore) * 100),
      criticalIssues: evaluation.issues.filter(
        (issue) => issue.severity === "high"
      ),
      recommendationsCount: evaluation.recommendations.length,
      needsRefactoring: evaluation.refactoringAnalysis.shouldRefactor,
      summary: this._generateSummary(evaluation),
    };
  }

  /**
   * Generate evaluation summary
   * @private
   */
  _generateSummary(evaluation) {
    const { score, maxScore, issues, refactoringAnalysis } = evaluation;
    const percentage = Math.round((score / maxScore) * 100);

    if (percentage >= 90) {
      return `Excellent function quality (${percentage}%). ${issues.length === 0 ? "No issues found." : "Minor improvements possible."}`;
    } else if (percentage >= 70) {
      return `Good function quality (${percentage}%). ${issues.length} issue(s) to address.`;
    } else if (percentage >= 50) {
      return `Moderate function quality (${percentage}%). ${issues.length} issue(s) need attention.`;
    } else {
      return `Poor function quality (${percentage}%). Significant refactoring ${refactoringAnalysis.shouldRefactor ? "recommended" : "may be needed"}.`;
    }
  }
}

/**
 * Default function quality analyzer instance
 */
export const functionQualityAnalyzer = new FunctionQualityAnalyzer();
