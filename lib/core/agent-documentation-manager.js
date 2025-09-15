/**
 * @fileoverview Territory C - Agent Documentation Manager
 * @description Manages sub-agent suite documentation and coordination for REQ-105
 */

/**
 * Agent Documentation Manager
 * Handles documentation and orchestration of specialized agents
 */
export class AgentDocumentationManager {
  constructor() {
    this.agents = new Map();
    this.coordinationRules = new Map();
    this.activationTriggers = new Map();
    this.initialized = false;
  }

  /**
   * Initialize agent documentation system
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async initialize() {
    try {
      this._defineAgents();
      this._defineCoordinationRules();
      this._defineActivationTriggers();
      this.initialized = true;
      return {
        success: true,
        message: "Agent documentation manager initialized",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize: ${error.message}`,
      };
    }
  }

  /**
   * Define all specialized agents and their responsibilities
   * @private
   */
  _defineAgents() {
    // Core Planning & Documentation Agents
    this.agents.set("planner", {
      name: "planner",
      category: "core",
      responsibility:
        "Extracts REQ IDs, analyzes codebase consistency, creates implementation plans",
      specialization: "Requirements analysis and planning",
    });

    this.agents.set("docs-writer", {
      name: "docs-writer",
      category: "core",
      responsibility:
        "Technical writing, README updates, CHANGELOG generation, requirements snapshots",
      specialization: "Documentation and technical writing",
    });

    // Quality Assurance Agents
    this.agents.set("test-writer", {
      name: "test-writer",
      category: "quality",
      responsibility:
        "Generates failing tests for REQ IDs, ensures testability evaluation, validates test quality and coverage",
      specialization: "Test generation and validation",
    });

    this.agents.set("PE-Reviewer", {
      name: "PE-Reviewer",
      category: "quality",
      responsibility:
        "Performs function quality analysis using 8-point checklist, enforces best practices",
      specialization: "Code quality and function evaluation",
    });

    this.agents.set("security-reviewer", {
      name: "security-reviewer",
      category: "quality",
      responsibility:
        "Specialized security analysis, activates when touching auth/network/fs/templates/db/crypto",
      specialization: "Security analysis and vulnerability assessment",
    });

    this.agents.set("debugger", {
      name: "debugger",
      category: "quality",
      responsibility:
        "Troubleshooting, error resolution, performance optimization",
      specialization: "Error resolution and debugging",
    });

    // Specialized Domain Agents
    this.agents.set("ux-tester", {
      name: "ux-tester",
      category: "domain",
      responsibility: "Human-centric testing scenarios, usability validation",
      specialization: "User experience testing",
    });

    this.agents.set("release-manager", {
      name: "release-manager",
      category: "domain",
      responsibility: "Git operations, versioning, CI/CD gate verification",
      specialization: "Release management and deployment",
    });
  }

  /**
   * Define coordination rules for multi-phase operations
   * @private
   */
  _defineCoordinationRules() {
    this.coordinationRules.set("QNEW/QPLAN", [
      { agent: "planner", phase: 1, action: "analyzes requirements" },
      {
        agent: "docs-writer",
        phase: 2,
        action: "snapshots to requirements.lock",
      },
    ]);

    this.coordinationRules.set("QCODE", [
      { agent: "test-writer", phase: 1, action: "creates failing tests" },
      { agent: "debugger", phase: 2, action: "assists implementation" },
    ]);

    this.coordinationRules.set("QCHECK", [
      { agent: "PE-Reviewer", phase: 1, action: "enforces quality" },
      {
        agent: "security-reviewer",
        phase: 2,
        action: "if security-sensitive",
        conditional: true,
      },
    ]);

    this.coordinationRules.set("QDOC", [
      {
        agent: "docs-writer",
        phase: 1,
        action: "updates documentation from diffs",
      },
    ]);

    this.coordinationRules.set("QGIT", [
      {
        agent: "release-manager",
        phase: 1,
        action: "validates gates then commits",
      },
    ]);
  }

  /**
   * Define activation triggers for conditional agents
   * @private
   */
  _defineActivationTriggers() {
    this.activationTriggers.set("security-reviewer", {
      triggers: ["auth", "network", "fs", "templates", "db", "crypto"],
      condition: "when changes touch security-sensitive areas",
    });

    this.activationTriggers.set("debugger", {
      triggers: ["test failures", "type errors", "runtime issues"],
      condition: "for error resolution and troubleshooting",
    });

    this.activationTriggers.set("test-writer", {
      triggers: ["new features", "API changes", "missing test coverage"],
      condition: "for new features and coverage validation",
    });
  }

  /**
   * Get agent information by name
   * @param {string} agentName - Name of the agent
   * @returns {Object|null} Agent information or null if not found
   */
  getAgent(agentName) {
    return this.agents.get(agentName) || null;
  }

  /**
   * Get coordination sequence for a QShortcut
   * @param {string} shortcut - QShortcut name (e.g., 'QCODE')
   * @returns {Array} Coordination sequence or empty array
   */
  getCoordinationSequence(shortcut) {
    return this.coordinationRules.get(shortcut) || [];
  }

  /**
   * Check if agent should activate for given triggers
   * @param {string} agentName - Name of the agent
   * @param {Array<string>} triggers - List of trigger conditions
   * @returns {boolean} True if agent should activate
   */
  shouldActivateAgent(agentName, triggers) {
    const agentTriggers = this.activationTriggers.get(agentName);
    if (!agentTriggers) return false;

    return triggers.some((trigger) =>
      agentTriggers.triggers.some((agentTrigger) =>
        trigger.toLowerCase().includes(agentTrigger.toLowerCase())
      )
    );
  }

  /**
   * Get all agents by category
   * @param {string} category - Category to filter by ('core', 'quality', 'domain')
   * @returns {Array} Agents in the specified category
   */
  getAgentsByCategory(category) {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.category === category
    );
  }

  /**
   * Get activation criteria for all conditional agents
   * @returns {Object} Map of agent names to their activation criteria
   */
  getActivationCriteria() {
    const criteria = {};
    for (const [agentName, config] of this.activationTriggers) {
      criteria[agentName] = {
        triggers: config.triggers,
        condition: config.condition,
      };
    }
    return criteria;
  }

  /**
   * Validate agent coordination workflow
   * @param {string} shortcut - QShortcut to validate
   * @param {Array<string>} executedAgents - Agents that were executed
   * @returns {{valid: boolean, missing?: Array<string>, errors?: Array<string>}}
   */
  validateWorkflow(shortcut, executedAgents) {
    const expectedSequence = this.getCoordinationSequence(shortcut);
    if (expectedSequence.length === 0) {
      return { valid: true };
    }

    const requiredAgents = expectedSequence
      .filter((step) => !step.conditional)
      .map((step) => step.agent);

    const missing = requiredAgents.filter(
      (agent) => !executedAgents.includes(agent)
    );

    return {
      valid: missing.length === 0,
      missing: missing.length > 0 ? missing : undefined,
    };
  }
}

/**
 * Default agent documentation manager instance
 */
export const agentDocumentationManager = new AgentDocumentationManager();
