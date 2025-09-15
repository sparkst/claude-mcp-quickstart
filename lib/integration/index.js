/**
 * @fileoverview Territory A & C - Integration Layer
 * @description Integration interfaces for Territory B, C, D dependencies
 */

import { generateId } from "../utils/index.js";
import { AgentCoordination, agentCoordination } from "./agent-coordination.js";

/**
 * Integration Bridge for Territory dependencies
 * Manages connections and data flow between territories
 */
export class TerritoryIntegrationBridge {
  constructor() {
    this.connections = new Map();
    this.eventHandlers = new Map();
    this.isActive = false;
  }

  /**
   * Register a territory connection
   * @param {string} territoryId - Territory identifier (B, C, or D)
   * @param {Object} connectionConfig - Connection configuration
   * @returns {{success: boolean, connectionId?: string, message?: string}}
   */
  registerTerritoryConnection(territoryId, connectionConfig = {}) {
    if (!territoryId || typeof territoryId !== "string") {
      return { success: false, message: "Invalid territory ID" };
    }

    const connectionId = generateId(`conn_${territoryId.toLowerCase()}`);
    const connection = {
      id: connectionId,
      territoryId,
      config: connectionConfig,
      status: "registered",
      createdAt: new Date().toISOString(),
    };

    this.connections.set(connectionId, connection);

    return {
      success: true,
      connectionId,
      message: `Territory ${territoryId} connection registered`,
    };
  }

  /**
   * Activate a territory connection
   * @param {string} connectionId - Connection identifier
   * @returns {{success: boolean, message?: string}}
   */
  activateConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, message: "Connection not found" };
    }

    connection.status = "active";
    connection.activatedAt = new Date().toISOString();

    return { success: true, message: "Connection activated successfully" };
  }

  /**
   * Send data to a territory
   * @param {string} territoryId - Target territory
   * @param {string} eventType - Event type
   * @param {any} data - Data to send
   * @returns {{success: boolean, message?: string}}
   */
  sendToTerritory(territoryId, eventType, data) {
    const connection = Array.from(this.connections.values()).find(
      (conn) => conn.territoryId === territoryId && conn.status === "active"
    );

    if (!connection) {
      return {
        success: false,
        message: `No active connection to Territory ${territoryId}`,
      };
    }

    // For now, just log the event - actual implementation will depend on territory specifics
    const event = {
      id: generateId("event"),
      territoryId,
      eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      message: `Event sent to Territory ${territoryId}`,
      event,
    };
  }

  /**
   * Register event handler for territory events
   * @param {string} eventType - Event type to handle
   * @param {Function} handler - Event handler function
   * @returns {{success: boolean, handlerId?: string, message?: string}}
   */
  onTerritoryEvent(eventType, handler) {
    if (typeof handler !== "function") {
      return { success: false, message: "Handler must be a function" };
    }

    const handlerId = generateId("handler");

    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Map());
    }

    this.eventHandlers.get(eventType).set(handlerId, handler);

    return {
      success: true,
      handlerId,
      message: `Event handler registered for ${eventType}`,
    };
  }

  /**
   * Get all active connections
   * @returns {Object[]} Array of active connections
   */
  getActiveConnections() {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.status === "active"
    );
  }

  /**
   * Get integration status
   * @returns {Object} Current integration status
   */
  getStatus() {
    const totalConnections = this.connections.size;
    const activeConnections = this.getActiveConnections().length;

    return {
      isActive: this.isActive,
      totalConnections,
      activeConnections,
      territories: Array.from(
        new Set(
          Array.from(this.connections.values()).map((conn) => conn.territoryId)
        )
      ),
    };
  }
}

/**
 * Default integration bridge instance
 */
export const integrationBridge = new TerritoryIntegrationBridge();

/**
 * Convenience functions for common integration patterns
 */

/**
 * Prepare Territory A for Territory C dependency
 * @returns {{success: boolean, message?: string}}
 */
export const prepareTerritoryC = () => {
  const result = integrationBridge.registerTerritoryConnection("C", {
    type: "dependency",
    priority: "high",
    dataFlow: "bidirectional",
  });

  if (result.success) {
    integrationBridge.activateConnection(result.connectionId);
  }

  return result;
};

/**
 * Prepare Territory A for Territory B dependency
 * @returns {{success: boolean, message?: string}}
 */
export const prepareTerritoryB = () => {
  const result = integrationBridge.registerTerritoryConnection("B", {
    type: "dependency",
    priority: "medium",
    dataFlow: "outbound",
  });

  if (result.success) {
    integrationBridge.activateConnection(result.connectionId);
  }

  return result;
};

/**
 * Prepare Territory A for Territory D dependency
 * @returns {{success: boolean, message?: string}}
 */
export const prepareTerritoryD = () => {
  const result = integrationBridge.registerTerritoryConnection("D", {
    type: "dependency",
    priority: "low",
    dataFlow: "inbound",
  });

  if (result.success) {
    integrationBridge.activateConnection(result.connectionId);
  }

  return result;
};

// Export Territory B TDD-QShortcuts integration
export * from "./tdd-qshortcuts-integration.js";

// Export Territory C agent coordination
export { AgentCoordination, agentCoordination };
