/**
 * RequirementsAnalyzer - Manages requirements discipline pattern for CLAUDE.md workflow
 *
 * Territory A implementation for REQ-102: Document Requirements Discipline Pattern
 * Follows CLAUDE.md TDD enforcement flow and testing best practices
 */

export class RequirementsAnalyzer {
  constructor() {
    this.reqIdPattern = /^REQ-\d+$/;
    this.reqHeadingPattern = /^## (REQ-\d+):\s*(.+)$/;
    this.testTitlePattern = /^REQ-\d+ — .+/;
    this.reqIdWithColonPattern = /^REQ-\d+:/;
  }

  /**
   * Extract requirement IDs from requirements lock content
   * REQ-102 test requirement
   */
  extractRequirementIds(lockContent) {
    const lines = lockContent.split("\n");
    const reqIds = [];

    for (const line of lines) {
      const match = line.match(this.reqHeadingPattern);
      if (match) {
        reqIds.push(match[1]);
      }
    }

    return reqIds;
  }

  /**
   * Parse requirements from markdown content
   * REQ-102 test requirement
   */
  parseRequirements(content) {
    const lines = content.split("\n");
    const requirements = [];
    let currentReq = null;
    let currentSection = "";

    for (const line of lines) {
      const headingMatch = line.match(this.reqHeadingPattern);

      if (headingMatch) {
        // Save previous requirement
        if (currentReq) {
          requirements.push(this._finalizeRequirement(currentReq));
        }

        // Start new requirement
        currentReq = {
          id: headingMatch[1],
          title: headingMatch[2].trim(),
          acceptance: [],
          nonGoals: [],
          notes: [],
        };
        currentSection = "";
      } else if (currentReq && line.trim()) {
        // Parse content lines
        if (line.includes("- Acceptance:")) {
          currentSection = "acceptance";
          const content = line.replace(/^.*- Acceptance:\s*/, "").trim();
          if (content) {
            currentReq.acceptance.push(content);
          }
        } else if (line.includes("- Non-Goals:")) {
          currentSection = "nonGoals";
          const content = line.replace(/^.*- Non-Goals:\s*/, "").trim();
          if (content) {
            currentReq.nonGoals.push(content);
          }
        } else if (line.includes("- Notes:")) {
          currentSection = "notes";
          const content = line.replace(/^.*- Notes:\s*/, "").trim();
          if (content) {
            currentReq.notes.push(content);
          }
        } else if (line.startsWith("-") && currentSection) {
          // Additional bullet points for current section
          const content = line.replace(/^-\s*/, "").trim();
          if (content) {
            currentReq[currentSection].push(content);
          }
        } else if (line.trim().startsWith("-") && !currentSection) {
          // Generic bullet point, treat as acceptance criteria
          const content = line.replace(/^-\s*/, "").trim();
          if (content) {
            currentReq.acceptance.push(content);
          }
        }
      }
    }

    // Save last requirement
    if (currentReq) {
      requirements.push(this._finalizeRequirement(currentReq));
    }

    return requirements;
  }

  /**
   * Finalize requirement object with proper validation
   * @private
   */
  _finalizeRequirement(req) {
    // Ensure acceptance criteria exists
    if (req.acceptance.length === 0) {
      req.acceptance.push("Must be implemented according to specification");
    }

    return req;
  }

  /**
   * Generate minimal template structure
   * REQ-102 test requirement
   */
  generateMinimalTemplate() {
    return `# Current Requirements

## REQ-101: <Concise requirement>
- Acceptance: <bullet points>
- Non-Goals: <optional>
- Notes: <links>

## REQ-102: <...>`;
  }

  /**
   * Create snapshot from current requirements
   * REQ-102 test requirement
   */
  createSnapshot(currentContent) {
    const snapshotHeader = "# Requirements Lock - Active Session\n\n";

    // Remove original header and replace with snapshot header
    const contentWithoutHeader = currentContent.replace(
      /^# Current Requirements.*?\n\n/s,
      ""
    );

    return snapshotHeader + contentWithoutHeader;
  }

  /**
   * Validate test title format
   * REQ-102 test requirement
   */
  validateTestTitle(testTitle) {
    return this.testTitlePattern.test(testTitle);
  }

  /**
   * Get workflow integration points
   * REQ-102 test requirement
   */
  getWorkflowIntegration() {
    return {
      qnewPhase: {
        agents: ["planner", "docs-writer"],
        outputs: [
          "requirements/current.md",
          "requirements/requirements.lock.md",
        ],
        description: "Extract REQ IDs and create requirements documentation",
      },
      qplanPhase: {
        agents: ["planner"],
        outputs: ["requirements/current.md"],
        description: "Analyze and plan implementation approach",
      },
    };
  }

  /**
   * Validate traceability between current and lock files
   * REQ-102 test requirement
   */
  validateTraceability(currentContent, lockContent) {
    const currentReqIds = this.extractRequirementIds(currentContent);
    const lockReqIds = this.extractRequirementIds(lockContent);

    const currentSet = new Set(currentReqIds);
    const lockSet = new Set(lockReqIds);

    const missingRequirements = currentReqIds.filter((id) => !lockSet.has(id));
    const extraRequirements = lockReqIds.filter((id) => !currentSet.has(id));

    return {
      isValid:
        missingRequirements.length === 0 && extraRequirements.length === 0,
      missingRequirements,
      extraRequirements,
      currentRequirements: currentReqIds,
      lockRequirements: lockReqIds,
    };
  }
}
