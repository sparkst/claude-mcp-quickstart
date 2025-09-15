/**
 * @fileoverview Territory A - Type Definitions and Interfaces
 * @description Core type definitions for Territory A implementation
 */

/**
 * @typedef {string} ModuleId
 * @description Branded type for module identifiers
 */

/**
 * @typedef {string} ComponentId
 * @description Branded type for component identifiers
 */

/**
 * @typedef {Object} TerritoryAConfig
 * @property {string} version - Configuration version
 * @property {boolean} enabled - Whether Territory A is enabled
 * @property {Object} options - Additional configuration options
 */

/**
 * @typedef {Object} TerritoryAResult
 * @property {boolean} success - Operation success status
 * @property {string} [message] - Optional result message
 * @property {any} [data] - Optional result data
 */

// Export type validation helpers
export const isModuleId = (value) =>
  typeof value === "string" && value.length > 0;
export const isComponentId = (value) =>
  typeof value === "string" && value.length > 0;
export const isTerritoryAConfig = (config) =>
  Boolean(
    config &&
      typeof config === "object" &&
      typeof config.version === "string" &&
      typeof config.enabled === "boolean"
  );
