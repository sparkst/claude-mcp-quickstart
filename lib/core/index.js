/**
 * @fileoverview Territory A & C - Core Module
 * @description Core functionality and business logic for Territory A & Territory C
 */

import { isModuleId, isTerritoryAConfig } from "../types/index.js";
import {
  AgentDocumentationManager,
  agentDocumentationManager,
} from "./agent-documentation-manager.js";
import {
  FunctionQualityAnalyzer,
  functionQualityAnalyzer,
} from "./function-quality-analyzer.js";

/**
 * Territory A Core Manager
 * Handles core functionality and module lifecycle
 */
export class TerritoryACore {
  constructor(config = {}) {
    if (!isTerritoryAConfig(config)) {
      throw new Error("Invalid Territory A configuration provided");
    }
    this.config = { ...config };
    this.modules = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize Territory A core
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return { success: true, message: "Already initialized" };
      }

      // Core initialization logic will be implemented here
      this.isInitialized = true;

      return {
        success: true,
        message: "Territory A core initialized successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: `Initialization failed: ${error.message}`,
      };
    }
  }

  /**
   * Register a module with Territory A
   * @param {string} moduleId - Unique module identifier
   * @param {Object} module - Module implementation
   * @returns {{success: boolean, message?: string}}
   */
  registerModule(moduleId, module) {
    if (!isModuleId(moduleId)) {
      return { success: false, message: "Invalid module ID provided" };
    }

    if (this.modules.has(moduleId)) {
      return {
        success: false,
        message: `Module ${moduleId} already registered`,
      };
    }

    this.modules.set(moduleId, module);
    return {
      success: true,
      message: `Module ${moduleId} registered successfully`,
    };
  }

  /**
   * Get registered module
   * @param {string} moduleId - Module identifier to retrieve
   * @returns {Object|null} Module implementation or null if not found
   */
  getModule(moduleId) {
    return this.modules.get(moduleId) || null;
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if Territory A is properly initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized && this.config.enabled;
  }
}

/**
 * Default Territory A core instance
 */
export const territoryACore = new TerritoryACore({
  version: "1.0.0",
  enabled: true,
  options: {},
});

// Export Territory B classes - TDD Enforcement and QShortcuts
export * from "./tdd-enforcer.js";
export * from "./qshortcuts-registry.js";

// Export Territory C classes and instances
export {
  AgentDocumentationManager,
  agentDocumentationManager,
  FunctionQualityAnalyzer,
  functionQualityAnalyzer,
};
