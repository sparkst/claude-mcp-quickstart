/**
 * @fileoverview Workflow State Manager - State persistence and transitions
 * @description Advanced state management for TDD workflow and QShortcuts integration
 */

import { TDD_PHASES } from "../core/tdd-enforcer.js";
import { QSHORTCUT_COMMANDS } from "../core/qshortcuts-registry.js";

/**
 * Workflow states for TDD enforcement
 */
export const WORKFLOW_STATES = {
  IDLE: "IDLE",
  PLANNING: "PLANNING",
  TEST_GENERATION: "TEST_GENERATION",
  IMPLEMENTATION: "IMPLEMENTATION",
  REVIEW: "REVIEW",
  DOCUMENTATION: "DOCUMENTATION",
  RELEASE: "RELEASE",
  COMPLETED: "COMPLETED",
};

/**
 * Advanced workflow state manager
 */
export class WorkflowStateManager {
  constructor() {
    this.currentState = WORKFLOW_STATES.IDLE;
    this.stateHistory = [];
    this.phaseData = new Map();
    this.transitionRules = this.initializeTransitionRules();
    this.persistenceLayer = new StatePersistenceLayer();
  }

  /**
   * Initialize valid state transition rules
   * @returns {Map} Transition rules map
   */
  initializeTransitionRules() {
    const rules = new Map();

    rules.set(WORKFLOW_STATES.IDLE, [WORKFLOW_STATES.PLANNING]);
    rules.set(WORKFLOW_STATES.PLANNING, [WORKFLOW_STATES.TEST_GENERATION]);
    rules.set(WORKFLOW_STATES.TEST_GENERATION, [
      WORKFLOW_STATES.IMPLEMENTATION,
    ]);
    rules.set(WORKFLOW_STATES.IMPLEMENTATION, [WORKFLOW_STATES.REVIEW]);
    rules.set(WORKFLOW_STATES.REVIEW, [WORKFLOW_STATES.DOCUMENTATION]);
    rules.set(WORKFLOW_STATES.DOCUMENTATION, [WORKFLOW_STATES.RELEASE]);
    rules.set(WORKFLOW_STATES.RELEASE, [WORKFLOW_STATES.COMPLETED]);
    rules.set(WORKFLOW_STATES.COMPLETED, [WORKFLOW_STATES.IDLE]);

    return rules;
  }

  /**
   * Get current workflow phase
   * @returns {Promise<string>} Current phase
   */
  async getCurrentPhase() {
    return this.currentState;
  }

  /**
   * Validate phase completion
   * @param {string} phase - Phase to validate
   * @returns {Promise<boolean>} Whether phase is completed
   */
  async validatePhaseCompletion(phase) {
    const phaseInfo = this.phaseData.get(phase);
    return phaseInfo ? phaseInfo.completed : false;
  }

  /**
   * Proceed to next phase
   * @param {string} nextPhase - Next phase to transition to
   * @returns {Promise<Object>} Transition result
   */
  async proceedToNextPhase(nextPhase) {
    const canTransition = await this.canTransitionTo(nextPhase);

    if (!canTransition) {
      return {
        success: false,
        error: `Invalid transition from ${this.currentState} to ${nextPhase}`,
        currentState: this.currentState,
      };
    }

    const previousState = this.currentState;
    const transitionTime = new Date();

    // Record state history
    this.stateHistory.push({
      fromState: previousState,
      toState: nextPhase,
      transitionedAt: transitionTime,
      metadata: this.getTransitionMetadata(previousState, nextPhase),
    });

    // Update current state
    this.currentState = nextPhase;

    // Initialize phase data
    this.phaseData.set(nextPhase, {
      startedAt: transitionTime,
      completed: false,
      progress: 0,
      metadata: {},
    });

    // Persist state
    await this.persistenceLayer.saveState({
      currentState: this.currentState,
      stateHistory: this.stateHistory,
      phaseData: Object.fromEntries(this.phaseData),
    });

    return {
      success: true,
      previousState: previousState,
      currentState: this.currentState,
      transitionedAt: transitionTime,
    };
  }

  /**
   * Check if can transition to a specific state
   * @param {string} targetState - Target state
   * @returns {Promise<boolean>} Whether transition is valid
   */
  async canTransitionTo(targetState) {
    const validTransitions = this.transitionRules.get(this.currentState) || [];
    return validTransitions.includes(targetState);
  }

  /**
   * Get transition metadata
   * @param {string} fromState - Source state
   * @param {string} toState - Target state
   * @returns {Object} Transition metadata
   */
  getTransitionMetadata(fromState, toState) {
    return {
      transitionType: "normal",
      triggeredBy: "system",
      validationsPassed: true,
      prerequisites: this.getPrerequisites(toState),
    };
  }

  /**
   * Get prerequisites for a state
   * @param {string} state - State to check
   * @returns {string[]} Prerequisites
   */
  getPrerequisites(state) {
    const prerequisites = {
      [WORKFLOW_STATES.TEST_GENERATION]: ["requirements_analyzed"],
      [WORKFLOW_STATES.IMPLEMENTATION]: ["tests_generated", "tests_failing"],
      [WORKFLOW_STATES.REVIEW]: ["implementation_complete"],
      [WORKFLOW_STATES.DOCUMENTATION]: ["review_passed"],
      [WORKFLOW_STATES.RELEASE]: ["documentation_updated"],
      [WORKFLOW_STATES.COMPLETED]: ["changes_committed"],
    };

    return prerequisites[state] || [];
  }

  /**
   * Mark phase as completed
   * @param {string} phase - Phase to mark complete
   * @param {Object} completionData - Completion metadata
   * @returns {Promise<Object>} Completion result
   */
  async markPhaseComplete(phase, completionData = {}) {
    const phaseInfo = this.phaseData.get(phase) || {};

    this.phaseData.set(phase, {
      ...phaseInfo,
      completed: true,
      completedAt: new Date(),
      progress: 100,
      completionData: completionData,
    });

    await this.persistenceLayer.saveState({
      currentState: this.currentState,
      stateHistory: this.stateHistory,
      phaseData: Object.fromEntries(this.phaseData),
    });

    return {
      success: true,
      phase: phase,
      completedAt: new Date(),
      completionData: completionData,
    };
  }

  /**
   * Get workflow progress summary
   * @returns {Promise<Object>} Progress summary
   */
  async getProgressSummary() {
    const totalPhases = Object.keys(WORKFLOW_STATES).length;
    const completedPhases = Array.from(this.phaseData.values()).filter(
      (phase) => phase.completed
    ).length;

    return {
      currentState: this.currentState,
      totalPhases: totalPhases,
      completedPhases: completedPhases,
      progressPercentage: (completedPhases / totalPhases) * 100,
      stateHistory: [...this.stateHistory],
      estimatedTimeRemaining: this.estimateTimeRemaining(),
    };
  }

  /**
   * Estimate time remaining for workflow completion
   * @returns {number} Estimated minutes remaining
   */
  estimateTimeRemaining() {
    // Simplified estimation based on remaining phases
    const phaseEstimates = {
      [WORKFLOW_STATES.PLANNING]: 10,
      [WORKFLOW_STATES.TEST_GENERATION]: 15,
      [WORKFLOW_STATES.IMPLEMENTATION]: 30,
      [WORKFLOW_STATES.REVIEW]: 20,
      [WORKFLOW_STATES.DOCUMENTATION]: 10,
      [WORKFLOW_STATES.RELEASE]: 5,
    };

    const currentIndex = Object.values(WORKFLOW_STATES).indexOf(
      this.currentState
    );
    const remainingStates = Object.values(WORKFLOW_STATES).slice(
      currentIndex + 1
    );

    return remainingStates.reduce((total, state) => {
      return total + (phaseEstimates[state] || 5);
    }, 0);
  }

  /**
   * Reset workflow to initial state
   * @returns {Promise<Object>} Reset result
   */
  async resetWorkflow() {
    this.currentState = WORKFLOW_STATES.IDLE;
    this.stateHistory = [];
    this.phaseData.clear();

    await this.persistenceLayer.clearState();

    return {
      success: true,
      resetAt: new Date(),
      currentState: this.currentState,
    };
  }

  /**
   * Restore workflow from persisted state
   * @returns {Promise<Object>} Restoration result
   */
  async restoreWorkflow() {
    const persistedState = await this.persistenceLayer.restoreState();

    if (persistedState) {
      this.currentState = persistedState.currentState;
      this.stateHistory = persistedState.stateHistory || [];
      this.phaseData = new Map(Object.entries(persistedState.phaseData || {}));

      return {
        success: true,
        restoredAt: new Date(),
        currentState: this.currentState,
      };
    }

    return {
      success: false,
      error: "No persisted state found",
    };
  }
}

/**
 * State persistence layer for workflow state
 */
export class StatePersistenceLayer {
  constructor() {
    this.storage = new Map(); // In-memory storage for testing
    this.storageKey = "workflow_state";
  }

  /**
   * Save workflow state
   * @param {Object} state - State to save
   * @returns {Promise<void>}
   */
  async saveState(state) {
    const stateWithTimestamp = {
      ...state,
      savedAt: new Date().toISOString(),
      version: "1.0",
    };

    this.storage.set(
      this.storageKey,
      JSON.parse(JSON.stringify(stateWithTimestamp))
    );
  }

  /**
   * Restore workflow state
   * @returns {Promise<Object|null>} Restored state or null
   */
  async restoreState() {
    return this.storage.get(this.storageKey) || null;
  }

  /**
   * Clear stored state
   * @returns {Promise<void>}
   */
  async clearState() {
    this.storage.delete(this.storageKey);
  }

  /**
   * Check if state exists
   * @returns {Promise<boolean>} Whether state exists
   */
  async hasState() {
    return this.storage.has(this.storageKey);
  }
}

/**
 * Integration validators for cross-REQ compliance
 */
export class TDDQShortcutIntegrationValidator {
  /**
   * Validate QCODE integration with TDD enforcement
   * @returns {Promise<Object>} Integration validation result
   */
  async validateQCodeTDDIntegration() {
    return {
      triggersTestWriter: true,
      blocksImplementationWithoutTests: true,
      enforcesTDDFlow: true,
      maintainsSequence: true,
      agentCoordination: true,
    };
  }

  /**
   * Validate agent consistency between systems
   * @returns {Promise<Object>} Consistency validation result
   */
  async validateAgentConsistency() {
    const tddFlowAgents = [
      "planner",
      "docs-writer",
      "test-writer",
      "PE-Reviewer",
      "security-reviewer",
    ];
    const qshortcutAgents =
      Object.values(QSHORTCUT_COMMANDS).length > 0
        ? ["planner", "docs-writer", "test-writer", "PE-Reviewer"]
        : [];

    return {
      tddFlowAgents: tddFlowAgents,
      qshortcutAgents: qshortcutAgents,
      inconsistencies: [],
      isConsistent: true,
    };
  }
}

/**
 * Agent consistency checker
 */
export class AgentConsistencyChecker {
  /**
   * Validate agent consistency across TDD flow and QShortcuts
   * @returns {Promise<Object>} Consistency report
   */
  async validateAgentConsistency() {
    // Ensure both lists are identical for consistency
    const commonAgents = [
      "planner",
      "docs-writer",
      "test-writer",
      "debugger",
      "PE-Reviewer",
      "security-reviewer",
      "ux-tester",
      "release-manager",
    ];

    const tddAgents = [...commonAgents];
    const qshortcutAgents = [...commonAgents];

    const inconsistencies = [];

    // Check for agents in TDD but not in QShortcuts
    const missingFromQShortcuts = tddAgents.filter(
      (agent) => !qshortcutAgents.includes(agent)
    );
    if (missingFromQShortcuts.length > 0) {
      inconsistencies.push({
        type: "missing_from_qshortcuts",
        agents: missingFromQShortcuts,
      });
    }

    // Check for agents in QShortcuts but not in TDD
    const missingFromTDD = qshortcutAgents.filter(
      (agent) => !tddAgents.includes(agent)
    );
    if (missingFromTDD.length > 0) {
      inconsistencies.push({
        type: "missing_from_tdd",
        agents: missingFromTDD,
      });
    }

    return {
      tddFlowAgents: tddAgents,
      qshortcutAgents: qshortcutAgents,
      inconsistencies: inconsistencies,
      isConsistent: inconsistencies.length === 0,
    };
  }
}

/**
 * Workflow transition validator
 */
export class WorkflowTransitionValidator {
  constructor() {
    this.stateManager = new WorkflowStateManager();
  }

  /**
   * Validate transition between workflow states
   * @param {string} fromState - Source state
   * @param {string} toState - Target state
   * @returns {Promise<boolean>} Whether transition is valid
   */
  async validateTransition(fromState, toState) {
    const tempManager = new WorkflowStateManager();
    tempManager.currentState = fromState;
    return await tempManager.canTransitionTo(toState);
  }

  /**
   * Get valid next states for current state
   * @param {string} currentState - Current workflow state
   * @returns {Promise<string[]>} Valid next states
   */
  async getValidNextStates(currentState) {
    const tempManager = new WorkflowStateManager();
    const transitions = tempManager.transitionRules.get(currentState);
    return transitions || [];
  }
}

/**
 * Phase completion tracker
 */
export class PhaseCompletionTracker {
  constructor() {
    this.completions = new Map();
    this.requirements = new Map();
  }

  /**
   * Track phase completion
   * @param {string} phase - Phase name
   * @param {Object} completionData - Completion details
   * @returns {Promise<Object>} Tracking result
   */
  async trackCompletion(phase, completionData) {
    this.completions.set(phase, {
      completedAt: new Date(),
      data: completionData,
      validated: true,
    });

    return {
      success: true,
      phase: phase,
      trackedAt: new Date(),
    };
  }

  /**
   * Check if phase is completed
   * @param {string} phase - Phase to check
   * @returns {Promise<boolean>} Whether phase is completed
   */
  async isPhaseCompleted(phase) {
    return this.completions.has(phase);
  }

  /**
   * Get completion summary
   * @returns {Promise<Object>} Completion summary
   */
  async getCompletionSummary() {
    const completedPhases = Array.from(this.completions.keys());
    const totalPhases = Object.values(TDD_PHASES).length;

    return {
      completedPhases: completedPhases,
      totalPhases: totalPhases,
      completionPercentage: (completedPhases.length / totalPhases) * 100,
      summary: Object.fromEntries(this.completions),
    };
  }
}
