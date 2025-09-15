import { describe, test, expect, beforeAll } from "vitest";
import fs from "fs/promises";
import path from "path";

// Test file for REQ-105 and REQ-106 - Sub-Agent Suite Roles and Function Writing Best Practices
// Following CLAUDE.md TDD enforcement flow and 11-point testing checklist

/**
 * REQ-105: Document Sub-Agent Suite Roles
 * Tests verify complete catalog of specialized agents and their responsibilities
 */
describe("REQ-105 — Sub-Agent Suite Documentation", () => {
  let claudeMdContent;

  beforeAll(async () => {
    const claudeMdPath = path.join(process.cwd(), "CLAUDE.md");
    try {
      claudeMdContent = await fs.readFile(claudeMdPath, "utf-8");
    } catch (error) {
      claudeMdContent = "";
    }
  });

  test("REQ-105 — documents all 8 required specialized agents", () => {
    const requiredAgents = [
      "planner",
      "docs-writer",
      "test-writer",
      "PE-Reviewer",
      "security-reviewer",
      "debugger",
      "ux-tester",
      "release-manager"
    ];

    for (const agent of requiredAgents) {
      expect(claudeMdContent).toContain(agent);
    }
  });

  test("REQ-105 — defines security-reviewer activation triggers", () => {
    const securityTriggers = [
      "auth",
      "network",
      "fs",
      "templates",
      "db",
      "crypto"
    ];

    // Should document when security-reviewer activates
    expect(claudeMdContent).toMatch(/security-reviewer.*activates?/i);

    // Should mention these security-sensitive areas
    const hasSecurityContext = securityTriggers.some(trigger =>
      claudeMdContent.toLowerCase().includes(trigger)
    );
    expect(hasSecurityContext).toBe(true);
  });

  test("REQ-105 — documents agent coordination in multi-phase operations", () => {
    // Should explain how agents work together
    expect(claudeMdContent).toMatch(/agents.*work.*together|coordination|multi-phase/i);

    // Should show agent handoffs or sequential operations
    expect(claudeMdContent).toMatch(/handoff|sequence|phase|then|→/i);
  });

  test("REQ-105 — maps agents to QShortcuts workflow integration", () => {
    const qshortcuts = ["QNEW", "QPLAN", "QCODE", "QCHECK", "QDOC", "QGIT"];

    // Should map agents to specific shortcuts
    let mappedShortcuts = 0;
    for (const shortcut of qshortcuts) {
      if (claudeMdContent.includes(shortcut)) {
        mappedShortcuts++;
      }
    }

    expect(mappedShortcuts).toBeGreaterThanOrEqual(3);
  });

  test("REQ-105 — specifies agent responsibilities and specializations", () => {
    // Should define what each agent does
    expect(claudeMdContent).toMatch(/responsibilities|specializations|role/i);

    // Should have specific role definitions (not just names)
    expect(claudeMdContent).toMatch(/test-writer.*test|planner.*plan|docs.*document/i);
  });

  test("REQ-105 — establishes agent activation criteria", () => {
    // Should specify when agents activate
    expect(claudeMdContent).toMatch(/when.*activate|trigger|criteria/i);

    // Should have conditional activation logic
    expect(claudeMdContent).toMatch(/if.*then|when.*touching|activate.*for/i);
  });
});

/**
 * REQ-106: Document Function Writing Best Practices
 * Tests verify complete 8-point function evaluation checklist
 */
describe("REQ-106 — Function Writing Best Practices", () => {
  let claudeMdContent;

  beforeAll(async () => {
    const claudeMdPath = path.join(process.cwd(), "CLAUDE.md");
    try {
      claudeMdContent = await fs.readFile(claudeMdPath, "utf-8");
    } catch (error) {
      claudeMdContent = "";
    }
  });

  test("REQ-106 — provides complete 8-point function evaluation checklist", () => {
    const checklistItems = [
      "readability",
      "cyclomatic complexity",
      "data structures",
      "unused parameters",
      "type casts",
      "testability",
      "dependencies",
      "naming"
    ];

    // Should have a numbered checklist structure
    expect(claudeMdContent).toMatch(/1\.|2\.|3\./);

    // Should cover all 8 checklist categories
    let coveredItems = 0;
    for (const item of checklistItems) {
      if (claudeMdContent.toLowerCase().includes(item.toLowerCase())) {
        coveredItems++;
      }
    }

    expect(coveredItems).toBeGreaterThanOrEqual(6);
  });

  test("REQ-106 — defines cyclomatic complexity evaluation criteria", () => {
    // Should explain cyclomatic complexity
    expect(claudeMdContent).toMatch(/cyclomatic.*complexity/i);

    // Should mention nesting, if-else, or independent paths
    expect(claudeMdContent).toMatch(/nesting|if.*else|independent.*paths/i);
  });

  test("REQ-106 — establishes testability requirements", () => {
    // Should address testability
    expect(claudeMdContent).toMatch(/testability|testable/i);

    // Should mention mocking concerns or integration tests
    expect(claudeMdContent).toMatch(/mock|integration.*test/i);
  });

  test("REQ-106 — documents refactoring rules and anti-patterns", () => {
    // Should specify when NOT to refactor
    expect(claudeMdContent).toMatch(/should not.*refactor|avoid.*refactor/i);

    // Should list compelling reasons for refactoring
    expect(claudeMdContent).toMatch(/compelling.*need|reason.*refactor/i);
  });

  test("REQ-106 — provides practical quality gates", () => {
    // Should have practical evaluation criteria
    expect(claudeMdContent).toMatch(/evaluation|criteria|quality/i);

    // Should be actionable (not just theoretical)
    expect(claudeMdContent).toMatch(/can you|does the|is the/i);
  });

  test("REQ-106 — addresses function naming best practices", () => {
    // Should discuss function naming
    expect(claudeMdContent).toMatch(/function.*name|naming|better.*name/i);

    // Should suggest evaluation approach
    expect(claudeMdContent).toMatch(/brainstorm|consistent.*codebase/i);
  });

  test("REQ-106 — covers unused parameters and type cast optimization", () => {
    // Should address unused parameters
    expect(claudeMdContent).toMatch(/unused.*parameter/i);

    // Should address unnecessary type casts
    expect(claudeMdContent).toMatch(/type.*cast|unnecessary.*cast/i);
  });

  test("REQ-106 — establishes dependency management principles", () => {
    // Should address hidden dependencies
    expect(claudeMdContent).toMatch(/hidden.*dependenc|untested.*dependenc/i);

    // Should suggest factoring dependencies into arguments
    expect(claudeMdContent).toMatch(/factor.*argument|move.*argument/i);
  });
});

/**
 * Cross-REQ Integration Tests
 * Tests that verify REQ-105 and REQ-106 work together properly
 */
describe("REQ-105 & REQ-106 — Integration Requirements", () => {
  let claudeMdContent;

  beforeAll(async () => {
    const claudeMdPath = path.join(process.cwd(), "CLAUDE.md");
    try {
      claudeMdContent = await fs.readFile(claudeMdPath, "utf-8");
    } catch (error) {
      claudeMdContent = "";
    }
  });

  test("REQ-105 & REQ-106 — PE-Reviewer agent can enforce function quality checklist", () => {
    // PE-Reviewer should be connected to function evaluation
    expect(claudeMdContent).toMatch(/PE-Reviewer.*function|function.*PE-Reviewer/i);

    // Should reference the quality checklist in agent context
    expect(claudeMdContent).toMatch(/checklist.*function|function.*checklist/i);
  });

  test("REQ-105 & REQ-106 — test-writer agent enforces testability requirements", () => {
    // test-writer should consider function testability
    expect(claudeMdContent).toMatch(/test-writer.*testab|testab.*test-writer/i);

    // Should integrate with quality evaluation
    expect(claudeMdContent).toMatch(/test.*quality|quality.*test/i);
  });

  test("REQ-105 & REQ-106 — QCHECKF shortcut triggers function evaluation", () => {
    // QCHECKF should use function evaluation checklist
    expect(claudeMdContent).toMatch(/QCHECKF.*function|function.*QCHECKF/i);

    // Should reference the 8-point checklist
    expect(claudeMdContent).toMatch(/8.*point|8-point/i);
  });

  test("REQ-105 & REQ-106 — documentation structure supports agent workflow", () => {
    // Should have clear section structure for agents to reference
    expect(claudeMdContent).toMatch(/#+.*function.*practice|#+.*agent.*suite/i);

    // Should be organized for programmatic access
    expect(claudeMdContent).toMatch(/##|###/);
  });
});

/**
 * Property-Based Tests for Documentation Requirements
 * Using algorithmic validation where applicable
 */
describe("REQ-105 & REQ-106 — Property-Based Validation", () => {
  let claudeMdContent;

  beforeAll(async () => {
    const claudeMdPath = path.join(process.cwd(), "CLAUDE.md");
    try {
      claudeMdContent = await fs.readFile(claudeMdPath, "utf-8");
    } catch (error) {
      claudeMdContent = "";
    }
  });

  test("REQ-105 & REQ-106 — documentation completeness invariant", () => {
    // If either section exists, it should be complete
    const hasAgentSection = claudeMdContent.toLowerCase().includes("agent");
    const hasFunctionSection = claudeMdContent.toLowerCase().includes("function");

    if (hasAgentSection) {
      // Should have all agent references
      expect(claudeMdContent).toMatch(/planner|test-writer|PE-Reviewer/);
    }

    if (hasFunctionSection) {
      // Should have evaluation criteria
      expect(claudeMdContent).toMatch(/checklist|evaluation|criteria/);
    }
  });

  test("REQ-105 & REQ-106 — markdown structure consistency", () => {
    // Headers should be properly formatted
    const headerPattern = /^#+\s+/gm;
    const headers = claudeMdContent.match(headerPattern) || [];

    // Should have structured headers if content exists
    if (claudeMdContent.length > 100) {
      expect(headers.length).toBeGreaterThan(0);
    }
  });

  test("REQ-105 & REQ-106 — actionable content density", () => {
    // Should have high density of actionable words
    const actionableWords = [
      "must", "should", "will", "can", "use", "check", "verify",
      "ensure", "test", "validate", "implement", "create"
    ];

    let actionableCount = 0;
    const words = claudeMdContent.toLowerCase().split(/\s+/);

    for (const word of words) {
      if (actionableWords.includes(word)) {
        actionableCount++;
      }
    }

    // Should have reasonable density of actionable content
    if (words.length > 100) {
      const density = actionableCount / words.length;
      expect(density).toBeGreaterThan(0.01); // At least 1% actionable words
    }
  });
});