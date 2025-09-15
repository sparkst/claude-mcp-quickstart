/**
 * REQ-108: Actionable Implementation Guide
 *
 * Provides step-by-step guidance for implementing new features using the
 * complete QNEW→QGIT workflow as specified in CLAUDE.md.
 *
 * This module includes practical examples, decision points, agent handoffs,
 * and troubleshooting guides for the entire development workflow.
 */

/**
 * Complete QNEW through QGIT workflow steps
 */
export const qnewToQgitFlow = {
  steps: [
    {
      name: "QNEW",
      description:
        "Understand all BEST PRACTICES listed in CLAUDE.md. Your code SHOULD ALWAYS follow these best practices.",
      agents: ["planner", "docs-writer"],
      purpose:
        "Extract REQ IDs, write requirements/current.md, snapshot to requirements.lock.md",
      outputs: ["requirements/current.md", "requirements/requirements.lock.md"],
    },
    {
      name: "QPLAN",
      description:
        "Analyze similar parts of the codebase and determine whether your plan is consistent, introduces minimal changes, reuses existing code",
      agents: ["planner"],
      purpose: "Create implementation plan consistent with codebase patterns",
      outputs: ["Implementation plan", "Architecture decisions"],
    },
    {
      name: "QCODE",
      description:
        "Implement your plan and make sure your new tests pass. Always run tests, prettier, typecheck, and lint.",
      agents: ["test-writer", "debugger"],
      purpose: "Create failing tests first, then implement to make them pass",
      outputs: ["Test files", "Implementation code", "Formatted code"],
    },
    {
      name: "QCHECK",
      description:
        "SKEPTICAL senior software engineer review of major code changes using CLAUDE.md checklists",
      agents: ["PE-Reviewer", "security-reviewer"],
      purpose: "Quality assurance and security review",
      outputs: ["Code review feedback", "Security assessment"],
    },
    {
      name: "QDOC",
      description:
        "Expert technical writer review to ensure full documentation per Progressive Documentation Guide",
      agents: ["docs-writer"],
      purpose: "Update documentation based on changes",
      outputs: ["Updated READMEs", "CHANGELOG entries"],
    },
    {
      name: "QGIT",
      description:
        "Add changes to staging, create commit, and push to remote using Conventional Commits format",
      agents: ["release-manager"],
      purpose: "Version control management and release preparation",
      outputs: ["Git commit", "Remote push", "Version tags"],
    },
  ],
};

/**
 * Step-by-step workflow guide
 */
export const stepByStepWorkflow = `
# Complete Feature Implementation Workflow

## QNEW: Project Initialization
1. Run QNEW command to activate planner and docs-writer agents
2. Planner extracts requirements and creates requirements/current.md
3. Docs-writer snapshots to requirements/requirements.lock.md
4. Verify all REQ-IDs are properly formatted (REQ-XXX)

## QPLAN: Architecture Planning
1. Run QPLAN to activate planner agent
2. Analyze existing codebase patterns
3. Create implementation approach that:
   - Is consistent with rest of codebase
   - Introduces minimal changes
   - Reuses existing code where possible

## QCODE: Test-Driven Implementation
1. Run QCODE to activate test-writer agent FIRST
2. Test-writer creates failing tests for each REQ-ID
3. Verify tests fail for the right reasons
4. Only then proceed with implementation
5. Run prettier, typecheck, and lint on all new files

## QCHECK: Quality Review
1. Run QCHECK for major code changes
2. PE-Reviewer applies function writing best practices checklist
3. Security-reviewer activates for auth/network/fs/templates/db/crypto changes
4. Address all feedback before proceeding

## QDOC: Documentation Update
1. Run QDOC to activate docs-writer
2. Update domain READMEs based on changes
3. Update CHANGELOG with new features/fixes
4. Ensure progressive documentation is complete

## QGIT: Version Control
1. Run QGIT to activate release-manager
2. Verify all tests pass
3. Create conventional commit with proper format
4. Push to remote repository
`;

/**
 * Agent handoff mapping
 */
export const agentHandoffs = {
  QNEW: ["planner", "docs-writer"],
  QPLAN: ["planner"],
  QCODE: ["test-writer", "debugger"],
  QCHECK: ["PE-Reviewer", "security-reviewer"],
  QDOC: ["docs-writer"],
  QGIT: ["release-manager"],
};

/**
 * Decision points in the workflow
 */
export const decisionPoints = {
  afterQPLAN: {
    question: "Is the implementation plan consistent with existing codebase?",
    yes: "Proceed to QCODE",
    no: "Revise plan with planner agent",
  },
  afterTestCreation: {
    question: "Do all tests fail for the expected reasons?",
    yes: "Proceed with implementation",
    no: "Fix or recreate tests with test-writer",
  },
  afterQCHECK: {
    question: "Did security-reviewer identify security concerns?",
    yes: "Address security issues before QDOC",
    no: "Proceed to QDOC",
  },
  beforeQGIT: {
    question: "Do all tests pass and is code properly formatted?",
    yes: "Proceed to QGIT",
    no: "Fix issues and re-run QCHECK",
  },
};

/**
 * Practical examples of requirement writing
 */
export const requirementWriting = {
  examples: [
    {
      id: "REQ-001",
      title: "User authentication with email validation",
      acceptance: [
        "User can register with valid email address",
        "Email validation prevents invalid formats",
        "Confirmation email sent within 5 minutes",
        "User can login after email confirmation",
      ],
      nonGoals: [
        "Social media authentication",
        "Multi-factor authentication",
        "Password complexity requirements",
      ],
    },
    {
      id: "REQ-002",
      title: "Data export functionality",
      acceptance: [
        "User can export data in CSV format",
        "Export includes all user-created content",
        "Export completed within 30 seconds for standard datasets",
        "Download link provided via email",
      ],
      nonGoals: [
        "Real-time data sync",
        "Incremental exports",
        "Custom export formats",
      ],
    },
  ],
};

/**
 * Practical examples of test creation
 */
export const testCreation = {
  examples: [
    {
      requirementId: "REQ-001",
      testTitle: "REQ-001 — should validate email format before registration",
      testCode: `test("REQ-001 — should validate email format before registration", () => {
  const invalidEmail = "invalid-email";
  const validEmail = "user@example.com";

  expect(validateEmail(invalidEmail)).toBe(false);
  expect(validateEmail(validEmail)).toBe(true);
});`,
      expectedFailure: "validateEmail function not implemented",
    },
    {
      requirementId: "REQ-002",
      testTitle: "REQ-002 — should complete data export within 30 seconds",
      testCode: `test("REQ-002 — should complete data export within 30 seconds", async () => {
  const startTime = Date.now();
  const result = await exportUserData(testUserId);
  const duration = Date.now() - startTime;

  expect(result.status).toBe('completed');
  expect(duration).toBeLessThan(30000);
});`,
      expectedFailure: "exportUserData function not implemented",
    },
  ],
};

/**
 * Practical implementation examples
 */
export const implementation = {
  examples: [
    {
      scenario: "Email validation for user registration",
      approach: "Use regex pattern with comprehensive validation",
      code: `export function validateEmail(email) {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}`,
      reasoning:
        "Simple, reliable pattern that covers most valid email formats",
    },
    {
      scenario: "Asynchronous data export with timeout",
      approach: "Promise-based implementation with built-in timeout",
      code: `export async function exportUserData(userId) {
  const timeout = 30000; // 30 seconds

  return Promise.race([
    performDataExport(userId),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Export timeout')), timeout)
    )
  ]);
}`,
      reasoning: "Ensures export completes within requirement timeframe",
    },
  ],
};

/**
 * Troubleshooting guide
 */
export const troubleshooting = {
  commonIssues: {
    "Tests not failing": {
      problem: "Created tests pass immediately without implementation",
      solution:
        "Verify test is testing the actual functionality, not mocked values",
      prevention: "Use test-writer agent to validate test failure reasons",
    },
    "Agent not activating": {
      problem: "Expected agent doesn't activate for QShortcut",
      solution:
        "Check if shortcut conditions are met (e.g., security-reviewer needs auth/network/fs changes)",
      prevention: "Review agent activation triggers before running shortcuts",
    },
    "Requirements drift": {
      problem: "Implementation doesn't match original requirements",
      solution: "Check requirements.lock.md against current implementation",
      prevention: "Reference REQ-IDs in all test titles and commit messages",
    },
  },
  solutions: {
    testFailures: "Run test-writer agent to recreate failing tests",
    securityConcerns: "Activate security-reviewer for sensitive code areas",
    documentationGaps: "Use docs-writer to update progressive documentation",
    codeQuality: "Apply PE-Reviewer checklist for function quality",
  },
};

/**
 * Practical examples container
 */
export const practicalExamples = {
  requirementWriting,
  testCreation,
  implementation,
  workflows: stepByStepWorkflow,
};

export default {
  stepByStepWorkflow,
  qnewToQgitFlow,
  decisionPoints,
  agentHandoffs,
  practicalExamples,
  requirementWriting,
  testCreation,
  implementation,
  troubleshooting,
};
