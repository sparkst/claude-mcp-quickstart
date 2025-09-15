/**
 * Agent Activation Guide
 *
 * Provides guidance on when and how agents are activated throughout
 * the development workflow. Includes security-reviewer activation
 * conditions and test-writer blocking mechanisms.
 */

/**
 * Agent activation mapping for QShortcuts
 */
export const workflowAgentActivation = {
  validateAgentActivation: (qshortcut) => {
    const activationMap = {
      QNEW: ["planner", "docs-writer"],
      QPLAN: ["planner"],
      QCODE: ["test-writer", "debugger"],
      QCHECK: ["PE-Reviewer", "security-reviewer"],
      QCHECKF: ["PE-Reviewer"],
      QCHECKT: ["PE-Reviewer", "test-writer"],
      QUX: ["ux-tester"],
      QDOC: ["docs-writer"],
      QGIT: ["release-manager"],
    };

    return activationMap[qshortcut] || [];
  },
};

/**
 * Security reviewer activation conditions
 */
export const securityReviewerActivation = {
  shouldActivateSecurityReviewer: (changeType) => {
    const securitySensitiveAreas = [
      "auth",
      "network",
      "fs",
      "templates",
      "db",
      "crypto",
    ];

    return securitySensitiveAreas.includes(changeType.toLowerCase());
  },

  // Detailed conditions for security review
  activationConditions: {
    auth: "Authentication, authorization, session management, password handling",
    network: "HTTP requests, API calls, external service integrations",
    fs: "File system operations, file uploads, path manipulation",
    templates: "Template rendering, user input interpolation, HTML generation",
    db: "Database queries, data validation, SQL injection prevention",
    crypto: "Encryption, hashing, random number generation, key management",
  },
};

/**
 * Test-writer blocking mechanism
 */
export const testWriterBlocking = {
  testWriterCanBlock: (reason) => {
    const blockingConditions = [
      "missing-req-coverage",
      "no-failing-tests",
      "trivial-assertions",
      "missing-req-id-reference",
    ];

    return blockingConditions.includes(reason);
  },

  blockingReasons: {
    "missing-req-coverage":
      "Not all requirements have corresponding failing tests",
    "no-failing-tests":
      "Tests pass without implementation (likely testing wrong thing)",
    "trivial-assertions":
      "Tests contain trivial assertions that cannot fail for real defects",
    "missing-req-id-reference":
      "Test titles do not reference REQ-IDs from requirements.lock",
  },

  resolutionActions: {
    "missing-req-coverage":
      "Create failing tests for all REQ-IDs in requirements.lock.md",
    "no-failing-tests":
      "Verify tests are testing actual functionality, not mocked/hardcoded values",
    "trivial-assertions":
      "Replace trivial assertions with meaningful tests that can fail",
    "missing-req-id-reference":
      'Update test titles to include REQ-ID references (e.g., "REQ-123 — should...")',
  },
};

/**
 * Agent coordination patterns
 */
export const agentCoordination = {
  // Sequential activation patterns
  sequential: {
    QNEW: {
      order: ["planner", "docs-writer"],
      description:
        "Planner first extracts requirements, then docs-writer creates snapshot",
    },
    QCODE: {
      order: ["test-writer", "debugger"],
      description:
        "Test-writer creates failing tests first, debugger helps if implementation fails",
    },
  },

  // Conditional activation patterns
  conditional: {
    "security-reviewer": {
      condition: "Changes touch auth/network/fs/templates/db/crypto",
      trigger: "QCHECK command with security-sensitive changes",
    },
    debugger: {
      condition: "Tests fail during implementation",
      trigger: "QCODE command when test failures occur",
    },
  },

  // Blocking patterns
  blocking: {
    "test-writer": {
      blocks: "Implementation phase",
      until: "All REQ-IDs have failing tests",
      override: "Never - fundamental TDD enforcement",
    },
  },
};

/**
 * Workflow validation helpers
 */
export const workflowValidation = {
  // Validate that correct agents are available for a workflow step
  validateWorkflowStep: (step, availableAgents) => {
    const requiredAgents =
      workflowAgentActivation.validateAgentActivation(step);
    return requiredAgents.every((agent) => availableAgents.includes(agent));
  },

  // Check if security review is needed
  needsSecurityReview: (changes) => {
    return changes.some((change) =>
      securityReviewerActivation.shouldActivateSecurityReviewer(change.type)
    );
  },

  // Validate test-writer can proceed
  canProceedWithImplementation: (testResults) => {
    return testResults.every(
      (result) => result.status === "failing" && result.hasReqId
    );
  },
};

/**
 * Agent-specific guidance
 */
export const agentGuidance = {
  planner: {
    responsibilities: [
      "Extract REQ-IDs from user requirements",
      "Create requirements/current.md",
      "Analyze codebase for consistency",
      "Plan minimal-change implementation approach",
    ],
    activatedBy: ["QNEW", "QPLAN"],
    outputs: ["requirements.md files", "implementation plans"],
  },

  "docs-writer": {
    responsibilities: [
      "Snapshot requirements to requirements.lock.md",
      "Update progressive documentation",
      "Maintain CHANGELOG",
      "Create domain READMEs",
    ],
    activatedBy: ["QNEW", "QDOC"],
    outputs: ["requirements.lock.md", "READMEs", "CHANGELOG"],
  },

  "test-writer": {
    responsibilities: [
      "Create failing tests for each REQ-ID",
      "Validate test quality per 11-point checklist",
      "Block implementation without proper test coverage",
      "Suggest testing improvements",
    ],
    activatedBy: ["QCODE", "QCHECKT"],
    outputs: ["Test files", "Test validation reports"],
    blockingPower: true,
  },

  "PE-Reviewer": {
    responsibilities: [
      "Apply function writing best practices checklist",
      "Review code quality and maintainability",
      "Validate testing best practices",
      "Ensure architectural consistency",
    ],
    activatedBy: ["QCHECK", "QCHECKF", "QCHECKT"],
    outputs: ["Code review feedback", "Quality assessments"],
  },

  "security-reviewer": {
    responsibilities: [
      "Review security-sensitive code changes",
      "Validate input sanitization",
      "Check for common vulnerabilities",
      "Ensure secure coding practices",
    ],
    activatedBy: ["QCHECK"],
    conditions: ["auth", "network", "fs", "templates", "db", "crypto"],
    outputs: ["Security assessments", "Vulnerability reports"],
  },

  debugger: {
    responsibilities: [
      "Help resolve test failures during implementation",
      "Assist with complex debugging scenarios",
      "Provide implementation guidance",
      "Support code troubleshooting",
    ],
    activatedBy: ["QCODE"],
    conditions: ["test failures", "implementation issues"],
    outputs: ["Debugging assistance", "Problem resolution"],
  },

  "ux-tester": {
    responsibilities: [
      "Design comprehensive UX test scenarios",
      "Prioritize testing scenarios by importance",
      "Provide human-testable instructions",
      "Validate user experience flows",
    ],
    activatedBy: ["QUX"],
    outputs: ["UX test scenarios", "User flow validation"],
  },

  "release-manager": {
    responsibilities: [
      "Verify all tests pass",
      "Validate code formatting and linting",
      "Create conventional commits",
      "Manage version control flow",
    ],
    activatedBy: ["QGIT"],
    outputs: ["Git commits", "Version tags", "Release preparation"],
  },
};

export default {
  workflowAgentActivation,
  securityReviewerActivation,
  testWriterBlocking,
  agentCoordination,
  workflowValidation,
  agentGuidance,
};
