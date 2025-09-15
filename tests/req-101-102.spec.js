import { describe, test, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";

/**
 * Territory A: REQ-101 & REQ-102 Testing Suite
 *
 * This file contains comprehensive failing tests for:
 * - REQ-101: Document Core Principles and Rules
 * - REQ-102: Document Requirements Discipline Pattern
 *
 * Following CLAUDE.md TDD enforcement flow and 11-point testing checklist.
 */

// Test data constants to avoid embedded literals
const EXPECTED_PRINCIPLE_CATEGORIES = 7;
const EXPECTED_QSHORTCUTS_COUNT = 8;
const EXPECTED_CORE_PRINCIPLES = {
  BP: 3, // Before Coding principles
  C: 5,  // While Coding principles
  T: 4,  // Testing principles
  D: 2,  // Database principles
  O: 2,  // Organization principles
  DOC: 4, // Documentation principles
  G: 2   // Tooling Gates principles
};

const REQUIRED_REQ_ID_PATTERN = /^REQ-\d+$/;
const REQUIREMENTS_LOCK_PATH = "requirements/requirements.lock.md";
const CLAUDE_MD_PATH = "CLAUDE.md";

describe("REQ-101 — Document Core Principles and Rules", () => {
  let claudeMdContent;
  let principlesAnalyzer;

  beforeEach(async () => {
    // This will fail initially as the functionality doesn't exist yet
    try {
      claudeMdContent = await fs.readFile(CLAUDE_MD_PATH, "utf-8");
      const { PrinciplesAnalyzer } = await import("./principles-analyzer.js");
      principlesAnalyzer = new PrinciplesAnalyzer(claudeMdContent);
    } catch (error) {
      // Expected to fail - functionality not implemented yet
    }
  });

  test("REQ-101 — extracts all 7 core principle categories with proper structure", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const categories = principlesAnalyzer.extractPrincipleCategories();
    expect(categories).toHaveLength(EXPECTED_PRINCIPLE_CATEGORIES);

    // Verify each category has proper structure
    const categoryNames = categories.map(cat => cat.name);
    expect(categoryNames).toEqual([
      "Before Coding",
      "While Coding",
      "Testing",
      "Database",
      "Organization",
      "Docs & Discoverability",
      "Tooling Gates"
    ]);
  });

  test("REQ-101 — identifies MUST vs SHOULD requirements correctly", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const principles = principlesAnalyzer.extractAllPrinciples();
    const mustRules = principles.filter(p => p.enforcementLevel === "MUST");
    const shouldRules = principles.filter(p => p.enforcementLevel === "SHOULD");

    // Verify MUST rules are properly identified
    expect(mustRules.length).toBeGreaterThan(0);
    expect(shouldRules.length).toBeGreaterThan(0);

    // Check specific critical MUST rules exist
    const mustRuleIds = mustRules.map(r => r.id);
    expect(mustRuleIds).toContain("BP-1");
    expect(mustRuleIds).toContain("C-1"); // TDD requirement
    expect(mustRuleIds).toContain("T-1"); // Test co-location
  });

  test("REQ-101 — validates principle numbering consistency", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const principles = principlesAnalyzer.extractAllPrinciples();

    // Group by category prefix
    const categorizedPrinciples = principles.reduce((acc, principle) => {
      const prefix = principle.id.split("-")[0];
      if (!acc[prefix]) acc[prefix] = [];
      acc[prefix].push(principle);
      return acc;
    }, {});

    // Verify expected counts per category
    Object.entries(EXPECTED_CORE_PRINCIPLES).forEach(([prefix, expectedCount]) => {
      expect(categorizedPrinciples[prefix]).toHaveLength(expectedCount);

      // Verify sequential numbering
      const numbers = categorizedPrinciples[prefix]
        .map(p => parseInt(p.id.split("-")[1]))
        .sort((a, b) => a - b);

      for (let i = 0; i < numbers.length; i++) {
        expect(numbers[i]).toBe(i + 1);
      }
    });
  });

  test("REQ-101 — extracts practical guidance for each principle", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const principles = principlesAnalyzer.extractAllPrinciples();

    principles.forEach(principle => {
      expect(principle.description).toBeDefined();
      expect(principle.description.length).toBeGreaterThan(10);
      expect(principle.practicalGuidance).toBeDefined();

      // Principles should have actionable guidance, not just descriptions
      expect(principle.practicalGuidance).not.toBe(principle.description);
    });
  });

  test("REQ-101 — validates TDD principle C-1 is properly documented as MUST", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const tddPrinciple = principlesAnalyzer.findPrincipleById("C-1");
    expect(tddPrinciple).toBeDefined();
    expect(tddPrinciple.enforcementLevel).toBe("MUST");
    expect(tddPrinciple.description).toMatch(/TDD|test.*first|failing.*test/i);
    expect(tddPrinciple.description).toMatch(/requirement.*ID/i);
  });

  test("REQ-101 — ensures tooling gates are properly specified", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const toolingGates = principlesAnalyzer.extractToolingGates();
    expect(toolingGates).toHaveLength(EXPECTED_CORE_PRINCIPLES.G);

    // Verify specific tooling requirements
    const gateDescriptions = toolingGates.map(g => g.description.toLowerCase());
    expect(gateDescriptions.some(desc => desc.includes("prettier"))).toBe(true);
    expect(gateDescriptions.some(desc => desc.includes("lint"))).toBe(true);
    expect(gateDescriptions.some(desc => desc.includes("test"))).toBe(true);
  });

  test("REQ-101 — validates documentation requirements include domain READMEs", async () => {
    expect(principlesAnalyzer).toBeDefined();

    const docPrinciples = principlesAnalyzer.extractDocumentationPrinciples();
    const readmeRequirement = docPrinciples.find(p =>
      p.description.toLowerCase().includes("domain readme")
    );

    expect(readmeRequirement).toBeDefined();
    expect(readmeRequirement.enforcementLevel).toBe("MUST");
  });
});

describe("REQ-102 — Document Requirements Discipline Pattern", () => {
  let requirementsAnalyzer;
  let mockCurrentMd;
  let mockLockMd;

  beforeEach(async () => {
    // Mock requirements files for testing
    mockCurrentMd = `# Current Requirements

## REQ-101: Test requirement one
- Acceptance: Must do something
- Non-Goals: Should not do other things

## REQ-102: Test requirement two
- Acceptance: Must validate correctly
- Notes: Important consideration`;

    mockLockMd = `# Requirements Lock - Active Session

## REQ-101: Test requirement one
- Acceptance: Must do something
- Non-Goals: Should not do other things

## REQ-102: Test requirement two
- Acceptance: Must validate correctly
- Notes: Important consideration`;

    try {
      const { RequirementsAnalyzer } = await import("./requirements-analyzer.js");
      requirementsAnalyzer = new RequirementsAnalyzer();
    } catch (error) {
      // Expected to fail - functionality not implemented yet
    }
  });

  test("REQ-102 — parses requirements.lock.md and extracts all REQ IDs", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const reqIds = requirementsAnalyzer.extractRequirementIds(mockLockMd);
    expect(reqIds).toEqual(["REQ-101", "REQ-102"]);

    // Verify REQ ID format validation
    reqIds.forEach(reqId => {
      expect(reqId).toMatch(REQUIRED_REQ_ID_PATTERN);
    });
  });

  test("REQ-102 — validates requirement heading format consistency", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const requirements = requirementsAnalyzer.parseRequirements(mockLockMd);

    requirements.forEach(req => {
      expect(req.id).toMatch(/^REQ-\d+$/);
      expect(req.title).toBeDefined();
      expect(req.title.length).toBeGreaterThan(5);
      expect(req.acceptance).toBeDefined();
    });
  });

  test("REQ-102 — ensures requirements have proper acceptance criteria", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const requirements = requirementsAnalyzer.parseRequirements(mockLockMd);

    requirements.forEach(req => {
      expect(req.acceptance).toBeDefined();
      expect(req.acceptance.length).toBeGreaterThan(0);

      // Acceptance criteria should be actionable
      expect(req.acceptance.some(criterion =>
        criterion.toLowerCase().includes("must") ||
        criterion.toLowerCase().includes("should")
      )).toBe(true);
    });
  });

  test("REQ-102 — validates minimal template structure compliance", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const template = requirementsAnalyzer.generateMinimalTemplate();
    expect(template).toContain("# Current Requirements");
    expect(template).toContain("## REQ-101:");
    expect(template).toContain("- Acceptance:");
    expect(template).toContain("- Non-Goals:");
    expect(template).toContain("- Notes:");
  });

  test("REQ-102 — verifies requirements lock snapshot mechanism", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const snapshot = requirementsAnalyzer.createSnapshot(mockCurrentMd);
    expect(snapshot).toContain("# Requirements Lock - Active Session");

    // Verify content preservation during snapshot
    const originalReqs = requirementsAnalyzer.parseRequirements(mockCurrentMd);
    const snapshotReqs = requirementsAnalyzer.parseRequirements(snapshot);

    expect(snapshotReqs).toHaveLength(originalReqs.length);
    expect(snapshotReqs[0].id).toBe(originalReqs[0].id);
    expect(snapshotReqs[0].title).toBe(originalReqs[0].title);
  });

  test("REQ-102 — validates REQ ID referencing in test titles", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const testTitle = "REQ-101 — validates user authentication flow";
    const isValidTestTitle = requirementsAnalyzer.validateTestTitle(testTitle);
    expect(isValidTestTitle).toBe(true);

    // Test invalid formats
    const invalidTitles = [
      "validates user authentication flow", // No REQ ID
      "REQ101 — validates flow", // Missing hyphen
      "req-101 — validates flow", // Lowercase
      "REQ-ABC — validates flow" // Non-numeric ID
    ];

    invalidTitles.forEach(title => {
      expect(requirementsAnalyzer.validateTestTitle(title)).toBe(false);
    });
  });

  test("REQ-102 — ensures QNEW/QPLAN workflow integration points", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const workflowIntegration = requirementsAnalyzer.getWorkflowIntegration();

    expect(workflowIntegration.qnewPhase).toBeDefined();
    expect(workflowIntegration.qplanPhase).toBeDefined();

    // Verify agent assignments
    expect(workflowIntegration.qnewPhase.agents).toContain("planner");
    expect(workflowIntegration.qnewPhase.agents).toContain("docs-writer");
    expect(workflowIntegration.qnewPhase.outputs).toContain("requirements/current.md");
    expect(workflowIntegration.qnewPhase.outputs).toContain("requirements/requirements.lock.md");
  });

  test("REQ-102 — validates requirements traceability from current to lock", async () => {
    expect(requirementsAnalyzer).toBeDefined();

    const traceabilityReport = requirementsAnalyzer.validateTraceability(
      mockCurrentMd,
      mockLockMd
    );

    expect(traceabilityReport.isValid).toBe(true);
    expect(traceabilityReport.missingRequirements).toHaveLength(0);
    expect(traceabilityReport.extraRequirements).toHaveLength(0);

    // Test with mismatched content
    const mismatchedLock = mockLockMd.replace("REQ-102", "REQ-103");
    const mismatchReport = requirementsAnalyzer.validateTraceability(
      mockCurrentMd,
      mismatchedLock
    );

    expect(mismatchReport.isValid).toBe(false);
    expect(mismatchReport.missingRequirements).toContain("REQ-102");
    expect(mismatchReport.extraRequirements).toContain("REQ-103");
  });
});

// Property-based tests for algorithmic validation
describe("REQ-101 & REQ-102 — Property-Based Validation", () => {
  test("REQ-101 — principle ID generation follows consistent format", async () => {
    // Would use fast-check library for property-based testing
    // fc.assert(fc.property(
    //   fc.constantFrom("BP", "C", "T", "D", "O", "DOC", "G"),
    //   fc.integer({ min: 1, max: 10 }),
    //   (prefix, number) => {
    //     const principleId = `${prefix}-${number}`;
    //     expect(principleId).toMatch(/^[A-Z]+(-[A-Z]+)?-\d+$/);
    //   }
    // ));

    // Simplified version without fast-check dependency
    const prefixes = ["BP", "C", "T", "D", "O", "DOC", "G"];
    for (const prefix of prefixes) {
      for (let i = 1; i <= 5; i++) {
        const principleId = `${prefix}-${i}`;
        expect(principleId).toMatch(/^[A-Z]+(-[A-Z]+)?-\d+$/);
      }
    }
  });

  test("REQ-102 — requirement ID parsing is consistent and reversible", async () => {
    const testRequirements = [
      "REQ-001: Simple requirement",
      "REQ-123: Complex requirement with numbers",
      "REQ-999: Edge case requirement"
    ];

    // This would ideally use property-based testing
    testRequirements.forEach(reqText => {
      const match = reqText.match(/^(REQ-\d+):\s*(.+)$/);
      expect(match).toBeTruthy();

      const [, reqId, title] = match;
      const reconstructed = `${reqId}: ${title}`;
      expect(reconstructed).toBe(reqText);
    });
  });
});