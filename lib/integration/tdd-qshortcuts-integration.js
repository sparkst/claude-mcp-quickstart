/**
 * @fileoverview TDD-QShortcuts Integration Layer - REQ-103 & REQ-104 Integration
 * @description Integration layer connecting TDD enforcement flow with QShortcuts system
 */

import { TDDEnforcer, TDD_PHASES } from "../core/tdd-enforcer.js";
import {
  QShortcutRegistry,
  QSHORTCUT_COMMANDS,
} from "../core/qshortcuts-registry.js";
import { AgentOrchestrator } from "../workflow/agent-orchestrator.js";
import {
  WorkflowStateManager,
  WORKFLOW_STATES,
} from "../workflow/workflow-state-manager.js";

/**
 * Mapping between QShortcuts and TDD phases
 */
export const QSHORTCUT_TDD_MAPPING = {
  QNEW: TDD_PHASES.QNEW_QPLAN,
  QPLAN: TDD_PHASES.QNEW_QPLAN,
  QCODE: [TDD_PHASES.QCODE_TEST_GENERATION, TDD_PHASES.QCODE_IMPLEMENTATION],
  QCHECK: TDD_PHASES.QCHECK_PHASES,
  QCHECKF: TDD_PHASES.QCHECK_PHASES,
  QCHECKT: TDD_PHASES.QCHECK_PHASES,
  QUX: TDD_PHASES.QCHECK_PHASES, // UX testing as part of review
  QDOC: TDD_PHASES.QDOC,
  QGIT: TDD_PHASES.QGIT,
};

/**
 * Integrated TDD-QShortcuts execution engine
 */
export class TDDQShortcutsIntegrationEngine {
  constructor() {
    this.tddEnforcer = new TDDEnforcer();
    this.qshortcutRegistry = new QShortcutRegistry();
    this.agentOrchestrator = new AgentOrchestrator();
    this.workflowManager = new WorkflowStateManager();
    this.executionHistory = [];
  }

  /**
   * Execute a QShortcut with TDD enforcement
   * @param {string} shortcut - QShortcut to execute
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Integrated execution result
   */
  async executeQShortcutWithTDD(shortcut, context = {}) {
    const executionId = `exec-${Date.now()}`;
    const startTime = new Date();

    try {
      // Validate shortcut exists
      const shortcutDetails =
        await this.qshortcutRegistry.getShortcutDetails(shortcut);

      // Get corresponding TDD phases
      const tddPhases = this.getTDDPhasesForShortcut(shortcut);

      // Validate TDD prerequisites
      const prerequisiteCheck = await this.validateTDDPrerequisites(
        shortcut,
        tddPhases
      );
      if (!prerequisiteCheck.valid) {
        return this.createFailureResult(
          executionId,
          startTime,
          prerequisiteCheck.reason
        );
      }

      // Execute TDD phases with agent coordination
      const tddResults = [];
      for (const phase of tddPhases) {
        const result = await this.tddEnforcer.executePhase(phase);
        tddResults.push(result);

        if (!result.success) {
          return this.createFailureResult(
            executionId,
            startTime,
            `TDD phase ${phase} failed: ${result.details?.error}`
          );
        }
      }

      // Execute QShortcut
      const qshortcutResult = await this.qshortcutRegistry.executeShortcut(
        shortcut,
        context
      );

      // Coordinate agents
      const agentCoordination = await this.coordinateAgents(
        shortcut,
        tddPhases,
        context
      );

      // Update workflow state
      const workflowUpdate = await this.updateWorkflowState(
        shortcut,
        tddPhases
      );

      // Record execution
      const execution = this.recordExecution(executionId, shortcut, tddPhases, {
        tddResults,
        qshortcutResult,
        agentCoordination,
        workflowUpdate,
        startTime,
        endTime: new Date(),
      });

      return this.createSuccessResult(executionId, execution);
    } catch (error) {
      return this.createFailureResult(executionId, startTime, error.message);
    }
  }

  /**
   * Get TDD phases for a QShortcut
   * @param {string} shortcut - QShortcut name
   * @returns {string[]} TDD phases
   */
  getTDDPhasesForShortcut(shortcut) {
    const mapping = QSHORTCUT_TDD_MAPPING[shortcut];
    return Array.isArray(mapping) ? mapping : [mapping];
  }

  /**
   * Validate TDD prerequisites for shortcut execution
   * @param {string} shortcut - QShortcut name
   * @param {string[]} tddPhases - Required TDD phases
   * @returns {Promise<Object>} Validation result
   */
  async validateTDDPrerequisites(shortcut, tddPhases) {
    // Special validation for QCODE - requires test generation first
    if (shortcut === "QCODE") {
      const testGenerationPhase = TDD_PHASES.QCODE_TEST_GENERATION;
      const canExecuteTests =
        this.tddEnforcer.canExecutePhase(testGenerationPhase);

      if (!canExecuteTests) {
        return {
          valid: false,
          reason:
            "QCODE requires completion of planning phases before test generation",
        };
      }

      // Check if attempting implementation without tests
      if (tddPhases.includes(TDD_PHASES.QCODE_IMPLEMENTATION)) {
        const testsExist = await this.tddEnforcer.validateTestsExist();
        if (!testsExist) {
          return {
            valid: false,
            reason:
              "Implementation blocked: test-writer must generate failing tests first",
          };
        }
      }
    }

    // Validate phase sequence
    for (const phase of tddPhases) {
      if (!this.tddEnforcer.canExecutePhase(phase)) {
        return {
          valid: false,
          reason: `Phase ${phase} prerequisites not met`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Coordinate agents for integrated execution
   * @param {string} shortcut - QShortcut name
   * @param {string[]} tddPhases - TDD phases
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Coordination result
   */
  async coordinateAgents(shortcut, tddPhases, context) {
    const shortcutAgents =
      await this.agentOrchestrator.getAgentsForShortcut(shortcut);
    const coordinationResults = [];

    // Coordinate agents for each TDD phase
    for (const phase of tddPhases) {
      const result = await this.agentOrchestrator.coordinatePhaseExecution(
        phase,
        {
          ...context,
          shortcut,
          integratedExecution: true,
        }
      );
      coordinationResults.push(result);
    }

    return {
      success: coordinationResults.every((r) => r.success),
      shortcutAgents,
      phaseCoordination: coordinationResults,
      totalAgentsActivated: this.countUniqueAgents(coordinationResults),
    };
  }

  /**
   * Update workflow state based on execution
   * @param {string} shortcut - QShortcut name
   * @param {string[]} tddPhases - Executed TDD phases
   * @returns {Promise<Object>} Workflow update result
   */
  async updateWorkflowState(shortcut, tddPhases) {
    const updates = [];

    for (const phase of tddPhases) {
      const workflowState = this.mapTDDPhaseToWorkflowState(phase);
      if (workflowState) {
        const update =
          await this.workflowManager.proceedToNextPhase(workflowState);
        updates.push(update);

        if (update.success) {
          await this.workflowManager.markPhaseComplete(phase, {
            shortcut,
            executedAt: new Date(),
          });
        }
      }
    }

    return {
      success: updates.every((u) => u.success),
      updates,
      currentState: await this.workflowManager.getCurrentPhase(),
    };
  }

  /**
   * Map TDD phase to workflow state
   * @param {string} tddPhase - TDD phase
   * @returns {string|null} Workflow state
   */
  mapTDDPhaseToWorkflowState(tddPhase) {
    const mapping = {
      [TDD_PHASES.QNEW_QPLAN]: WORKFLOW_STATES.PLANNING,
      [TDD_PHASES.QCODE_TEST_GENERATION]: WORKFLOW_STATES.TEST_GENERATION,
      [TDD_PHASES.QCODE_IMPLEMENTATION]: WORKFLOW_STATES.IMPLEMENTATION,
      [TDD_PHASES.QCHECK_PHASES]: WORKFLOW_STATES.REVIEW,
      [TDD_PHASES.QDOC]: WORKFLOW_STATES.DOCUMENTATION,
      [TDD_PHASES.QGIT]: WORKFLOW_STATES.RELEASE,
    };

    return mapping[tddPhase] || null;
  }

  /**
   * Count unique agents across coordination results
   * @param {Object[]} coordinationResults - Coordination results
   * @returns {number} Unique agent count
   */
  countUniqueAgents(coordinationResults) {
    const allAgents = coordinationResults.flatMap(
      (r) => r.activatedAgents || []
    );
    return new Set(allAgents).size;
  }

  /**
   * Record execution for history tracking
   * @param {string} executionId - Execution ID
   * @param {string} shortcut - QShortcut name
   * @param {string[]} tddPhases - TDD phases
   * @param {Object} results - Execution results
   * @returns {Object} Execution record
   */
  recordExecution(executionId, shortcut, tddPhases, results) {
    const execution = {
      id: executionId,
      shortcut,
      tddPhases,
      results,
      metadata: {
        integratedExecution: true,
        agentCount: results.agentCoordination?.totalAgentsActivated || 0,
        duration: results.endTime - results.startTime,
      },
    };

    this.executionHistory.push(execution);
    return execution;
  }

  /**
   * Create success result
   * @param {string} executionId - Execution ID
   * @param {Object} execution - Execution details
   * @returns {Object} Success result
   */
  createSuccessResult(executionId, execution) {
    return {
      success: true,
      executionId,
      shortcut: execution.shortcut,
      tddPhases: execution.tddPhases,
      agentsActivated:
        execution.results.agentCoordination?.shortcutAgents || [],
      workflowState: execution.results.workflowUpdate?.currentState,
      duration: execution.metadata.duration,
      integratedExecution: true,
    };
  }

  /**
   * Create failure result
   * @param {string} executionId - Execution ID
   * @param {Date} startTime - Start time
   * @param {string} reason - Failure reason
   * @returns {Object} Failure result
   */
  createFailureResult(executionId, startTime, reason) {
    return {
      success: false,
      executionId,
      error: reason,
      duration: new Date() - startTime,
      integratedExecution: true,
    };
  }

  /**
   * Get execution history
   * @returns {Object[]} Execution history
   */
  getExecutionHistory() {
    return [...this.executionHistory];
  }

  /**
   * Get integration status
   * @returns {Promise<Object>} Integration status
   */
  async getIntegrationStatus() {
    const workflowProgress = await this.workflowManager.getProgressSummary();
    const tddCompleted = this.tddEnforcer.isWorkflowComplete();

    return {
      tddWorkflowComplete: tddCompleted,
      workflowProgress,
      totalExecutions: this.executionHistory.length,
      lastExecution:
        this.executionHistory[this.executionHistory.length - 1] || null,
      integrationActive: true,
    };
  }
}
