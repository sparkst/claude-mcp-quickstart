/**
 * @fileoverview Territory A - Architecture Foundation Tests
 * @description REQ-ARCH-001: Verify architectural foundation is solid
 */

import { describe, test, expect } from "vitest";
import {
  TerritoryACore,
  territoryACore,
  TerritoryIntegrationBridge,
  integrationBridge,
  generateId,
  validateInput,
  deepClone,
  isModuleId,
  isTerritoryAConfig,
  prepareTerritoryB,
  prepareTerritoryC,
  prepareTerritoryD,
} from "./index.js";

describe("TerritoryACore", () => {
  test("REQ-ARCH-001 — initializes with valid configuration", async () => {
    const config = { version: "1.0.0", enabled: true, options: {} };
    const core = new TerritoryACore(config);

    const result = await core.initialize();

    expect(result.success).toBe(true);
    expect(core.isReady()).toBe(true);
    expect(core.getConfig()).toEqual(config);
  });

  test("REQ-ARCH-001 — rejects invalid configuration", () => {
    expect(() => new TerritoryACore("invalid")).toThrow(
      "Invalid Territory A configuration"
    );
  });

  test("REQ-ARCH-001 — manages module registration correctly", () => {
    const core = new TerritoryACore({
      version: "1.0.0",
      enabled: true,
      options: {},
    });
    const mockModule = { name: "test-module" };

    const registerResult = core.registerModule("test-123", mockModule);
    expect(registerResult.success).toBe(true);
    expect(core.getModule("test-123")).toBe(mockModule);

    // Duplicate registration should fail
    const duplicateResult = core.registerModule("test-123", mockModule);
    expect(duplicateResult.success).toBe(false);
  });
});

describe("TerritoryIntegrationBridge", () => {
  test("REQ-ARCH-001 — registers territory connections", () => {
    const bridge = new TerritoryIntegrationBridge();

    const result = bridge.registerTerritoryConnection("B", { type: "test" });

    expect(result.success).toBe(true);
    expect(result.connectionId).toBeDefined();
    expect(typeof result.connectionId).toBe("string");
  });

  test("REQ-ARCH-001 — activates connections and sends events", () => {
    const bridge = new TerritoryIntegrationBridge();

    const registerResult = bridge.registerTerritoryConnection("C", {});
    expect(registerResult.success).toBe(true);

    const activateResult = bridge.activateConnection(
      registerResult.connectionId
    );
    expect(activateResult.success).toBe(true);

    const sendResult = bridge.sendToTerritory("C", "test-event", {
      data: "test",
    });
    expect(sendResult.success).toBe(true);
  });

  test("REQ-ARCH-001 — provides correct status information", () => {
    const bridge = new TerritoryIntegrationBridge();

    const status1 = bridge.getStatus();
    expect(status1.totalConnections).toBe(0);
    expect(status1.activeConnections).toBe(0);

    const registerResult = bridge.registerTerritoryConnection("D", {});
    bridge.activateConnection(registerResult.connectionId);

    const status2 = bridge.getStatus();
    expect(status2.totalConnections).toBe(1);
    expect(status2.activeConnections).toBe(1);
    expect(status2.territories).toEqual(["D"]);
  });
});

describe("Utility Functions", () => {
  test("REQ-ARCH-001 — generateId creates unique identifiers", () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId("custom");

    expect(id1).not.toBe(id2);
    expect(id3.startsWith("custom_")).toBe(true);
    expect(typeof id1).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
  });

  test("REQ-ARCH-001 — validateInput validates data correctly", () => {
    const validResult = validateInput("test", { type: "string", minLength: 2 });
    expect(validResult.valid).toBe(true);
    expect(validResult.data).toBe("test");

    const invalidResult = validateInput("a", { type: "string", minLength: 2 });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toContain("Minimum length is 2");
  });

  test("REQ-ARCH-001 — deepClone creates independent copies", () => {
    const original = { a: 1, b: { c: 2 }, d: [3, 4] };
    const cloned = deepClone(original);

    cloned.a = 999;
    cloned.b.c = 999;
    cloned.d.push(999);

    expect(original.a).toBe(1);
    expect(original.b.c).toBe(2);
    expect(original.d).toEqual([3, 4]);
  });
});

describe("Type Validation", () => {
  test("REQ-ARCH-001 — isModuleId validates module identifiers", () => {
    expect(isModuleId("valid-module")).toBe(true);
    expect(isModuleId("")).toBe(false);
    expect(isModuleId(null)).toBe(false);
    expect(isModuleId(123)).toBe(false);
  });

  test("REQ-ARCH-001 — isTerritoryAConfig validates configurations", () => {
    expect(isTerritoryAConfig({ version: "1.0.0", enabled: true })).toBe(true);
    expect(isTerritoryAConfig({ version: "1.0.0", enabled: "true" })).toBe(
      false
    );
    expect(isTerritoryAConfig({ enabled: true })).toBe(false);
    expect(isTerritoryAConfig(null)).toBe(false);
  });
});

describe("Integration Helpers", () => {
  test("REQ-ARCH-001 — territory preparation functions work correctly", () => {
    const resultB = prepareTerritoryB();
    const resultC = prepareTerritoryC();
    const resultD = prepareTerritoryD();

    expect(resultB.success).toBe(true);
    expect(resultC.success).toBe(true);
    expect(resultD.success).toBe(true);

    const status = integrationBridge.getStatus();
    expect(status.territories).toContain("B");
    expect(status.territories).toContain("C");
    expect(status.territories).toContain("D");
  });
});

describe("Default Instances", () => {
  test("REQ-ARCH-001 — default instances are properly configured", () => {
    expect(territoryACore).toBeInstanceOf(TerritoryACore);
    expect(territoryACore.getConfig().version).toBe("1.0.0");
    expect(territoryACore.getConfig().enabled).toBe(true);

    expect(integrationBridge).toBeInstanceOf(TerritoryIntegrationBridge);
    expect(typeof integrationBridge.getStatus).toBe("function");
  });
});
