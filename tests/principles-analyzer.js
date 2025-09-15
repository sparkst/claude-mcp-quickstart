/**
 * PrinciplesAnalyzer - Parses CLAUDE.md structure for core principles validation
 *
 * Territory A implementation for REQ-101: Document Core Principles and Rules
 * Follows CLAUDE.md TDD enforcement flow and testing best practices
 */

export class PrinciplesAnalyzer {
  constructor(claudeMdContent) {
    this.content = claudeMdContent;
    this.sections = this._parseSections();
    this.principles = this._extractPrinciples();
  }

  /**
   * Parse the markdown content into sections
   * @private
   */
  _parseSections() {
    const lines = this.content.split("\n");
    const sections = {};
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      if (line.startsWith("### ") && line.includes("—")) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join("\n");
        }

        // Extract section name (e.g., "1 — Before Coding" -> "Before Coding")
        const match = line.match(/### \d+ — (.+)/);
        if (match) {
          currentSection = match[1];
          currentContent = [];
        }
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join("\n");
    }

    return sections;
  }

  /**
   * Extract all principles from the content
   * @private
   */
  _extractPrinciples() {
    const principles = [];
    const lines = this.content.split("\n");

    for (const line of lines) {
      // Match principle lines like "- **BP‑1 (MUST)** Ask clarifying questions..."
      // Note: CLAUDE.md uses em dashes (‑) not regular hyphens (-)
      const match = line.match(
        /^- \*\*([A-Z‑]+)‑(\d+) \((MUST|SHOULD|SHOULD NOT)\)\*\* (.+)/
      );
      if (match) {
        const [, prefix, number, enforcement, description] = match;
        const id = `${prefix}-${number}`;

        principles.push({
          id,
          prefix,
          number: parseInt(number),
          enforcementLevel: enforcement,
          description: description.trim(),
          practicalGuidance: this._extractPracticalGuidance(
            description,
            enforcement
          ),
        });
      }
    }

    return principles;
  }

  /**
   * Generate practical guidance based on description and enforcement level
   * @private
   */
  _extractPracticalGuidance(description, enforcement) {
    // Create practical guidance that's different from description
    const baseGuidance = description.toLowerCase();

    if (enforcement === "MUST") {
      return `Critical requirement: ${baseGuidance}. This rule is CI-enforced and must be followed.`;
    } else if (enforcement === "SHOULD") {
      return `Recommended practice: ${baseGuidance}. Strongly recommended for maintainability.`;
    } else if (enforcement === "SHOULD NOT") {
      return `Avoid this practice: ${baseGuidance}. Generally discouraged unless necessary.`;
    }

    return `Guidance: ${baseGuidance}`;
  }

  /**
   * Extract all principle categories with proper structure
   * REQ-101 test requirement
   */
  extractPrincipleCategories() {
    const categoryOrder = [
      "Before Coding",
      "While Coding",
      "Testing",
      "Database",
      "Organization",
      "Docs & Discoverability",
      "Tooling Gates",
    ];

    return categoryOrder.map((name) => ({
      name,
      content: this.sections[name] || "",
      principles: this.principles.filter((p) => {
        const prefixMap = {
          "Before Coding": "BP",
          "While Coding": "C",
          Testing: "T",
          Database: "D",
          Organization: "O",
          "Docs & Discoverability": "DOC",
          "Tooling Gates": "G",
        };
        return p.prefix === prefixMap[name];
      }),
    }));
  }

  /**
   * Extract all principles with full details
   * REQ-101 test requirement
   */
  extractAllPrinciples() {
    return this.principles;
  }

  /**
   * Find a specific principle by its ID
   * REQ-101 test requirement
   */
  findPrincipleById(principleId) {
    return this.principles.find((p) => p.id === principleId);
  }

  /**
   * Extract tooling gate principles specifically
   * REQ-101 test requirement
   */
  extractToolingGates() {
    return this.principles.filter((p) => p.prefix === "G");
  }

  /**
   * Extract documentation principles specifically
   * REQ-101 test requirement
   */
  extractDocumentationPrinciples() {
    return this.principles.filter((p) => p.prefix === "DOC");
  }
}
