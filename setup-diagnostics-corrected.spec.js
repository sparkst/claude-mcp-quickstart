/**
 * Test Suite for Setup Diagnostics - Claude Desktop Architecture Correction
 * REQ-201, REQ-202, REQ-203, REQ-204, REQ-205, REQ-206
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import {
  verifyClaudeSetup,
  detectSetupFailures,
  generateTroubleshootingReport,
  testBuiltInFeatures,
  validateMcpServersOnly,
} from "./setup-diagnostics.js";

// Mock filesystem calls
vi.mock("fs/promises");

describe("REQ-201 - Correct Claude Desktop Architecture Understanding", () => {
  test("REQ-201 - should distinguish built-in vs MCP server tools", async () => {
    // This test should pass after implementation
    const analysis = await verifyClaudeSetup("/test/project");

    expect(analysis.builtInFeatures).toBeDefined();
    expect(analysis.mcpServers).toBeDefined();
    expect(analysis.builtInFeatures.filesystem).toBeDefined();
    expect(analysis.builtInFeatures.context7).toBeDefined();
    expect(analysis.builtInFeatures.github).toBeDefined();

    // Built-in features should not be validated through MCP config
    expect(analysis.builtInFeatures.filesystem.validatedVia).toBe(
      "direct_tool_test"
    );
    expect(analysis.builtInFeatures.context7.validatedVia).toBe(
      "direct_tool_test"
    );
    expect(analysis.builtInFeatures.github.validatedVia).toBe(
      "direct_tool_test"
    );
  });

  test("REQ-201 - should only validate actual MCP servers through configuration", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        supabase: { command: "npx", args: ["-y", "mcp-server-supabase"] },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    fs.access.mockResolvedValue();

    const analysis = await verifyClaudeSetup("/test/project");

    // Should only validate actual MCP servers
    expect(analysis.mcpServers).toHaveProperty("memory");
    expect(analysis.mcpServers).toHaveProperty("supabase");
    expect(analysis.mcpServers).not.toHaveProperty("filesystem");
    expect(analysis.mcpServers).not.toHaveProperty("context7");
    expect(analysis.mcpServers).not.toHaveProperty("github");
  });
});

describe("REQ-202 - Direct Tool Testing for Built-in Features", () => {
  test("REQ-202 - should test Filesystem access by attempting file operations", async () => {
    const testResults = await testBuiltInFeatures();

    expect(testResults).toBeDefined();
    expect(testResults.filesystem).toBeDefined();
    expect(testResults.filesystem.method).toBe("file_operation");
  });

  test("REQ-202 - should test Context7 by attempting library documentation lookup", async () => {
    const testResults = await testBuiltInFeatures();

    expect(testResults.context7).toBeDefined();
    expect(testResults.context7.method).toBe("documentation_lookup");
  });

  test("REQ-202 - should test Github by attempting repository operations", async () => {
    const testResults = await testBuiltInFeatures();

    expect(testResults.github).toBeDefined();
    expect(testResults.github.method).toBe("repository_access");
  });

  test("REQ-202 - should not check MCP configuration for built-in tools", async () => {
    const testResults = await testBuiltInFeatures();

    // Should not reference MCP configuration at all
    expect(testResults.filesystem.checkedMcpConfig).toBe(false);
    expect(testResults.context7.checkedMcpConfig).toBe(false);
    expect(testResults.github.checkedMcpConfig).toBe(false);
  });
});

describe("REQ-203 - Correct Troubleshooting Guidance", () => {
  test("REQ-203 - should direct users to Settings->Extensions for Filesystem issues", async () => {
    const mockFailures = [
      {
        type: "FILESYSTEM_NOT_AVAILABLE",
        severity: "critical",
        context: { toolType: "built-in" },
        title: "Filesystem Extension Not Available",
        description:
          "Claude cannot access your project files - filesystem extension may not be enabled",
        resolution: [
          "Open Claude Desktop application",
          "Navigate to Settings → Extensions",
          "Enable the 'Filesystem' extension",
          "Add your project directory to allowed paths",
          "Restart Claude Desktop application",
        ],
      },
    ];

    const report = generateTroubleshootingReport(
      mockFailures,
      null,
      "/test/project"
    );

    const filesystemStep = report.steps.find((step) =>
      step.title.toLowerCase().includes("filesystem")
    );

    expect(filesystemStep).toBeDefined();
    expect(filesystemStep.actions).toContain(
      "Navigate to Settings → Extensions"
    );
    expect(filesystemStep.actions).not.toContain("claude_desktop_config.json");
  });

  test("REQ-203 - should direct users to Settings->Connectors for Github issues", async () => {
    const mockFailures = [
      {
        type: "GITHUB_NOT_AVAILABLE",
        severity: "high",
        context: { toolType: "built-in" },
        title: "GitHub Connector Not Available",
        description:
          "GitHub integration is not available - connector may not be enabled",
        resolution: [
          "Open Claude Desktop application",
          "Navigate to Settings → Connectors",
          "Enable the 'GitHub' connector",
          "Authenticate with your GitHub account",
          "Restart Claude Desktop application",
        ],
      },
    ];

    const report = generateTroubleshootingReport(
      mockFailures,
      null,
      "/test/project"
    );

    const githubStep = report.steps.find((step) =>
      step.title.toLowerCase().includes("github")
    );

    expect(githubStep).toBeDefined();
    expect(githubStep.actions).toContain("Navigate to Settings → Connectors");
    expect(githubStep.actions).not.toContain("MCP server");
  });

  test("REQ-203 - should provide MCP troubleshooting only for custom servers", async () => {
    const mockFailures = [
      {
        type: "MCP_SERVER_NOT_RUNNING",
        severity: "high",
        context: { serverName: "memory", toolType: "mcp" },
        title: "MCP Servers Not Running or Accessible",
        description:
          "Required MCP servers are not responding or configured incorrectly",
        resolution: [
          "Check if MCP server processes are running",
          "Verify server configuration paths and arguments",
          "Check server logs for startup errors",
          "Test server connectivity independently",
          "Restart MCP servers and Claude Desktop",
          "Check claude_desktop_config.json for configuration issues",
        ],
      },
    ];

    const report = generateTroubleshootingReport(
      mockFailures,
      null,
      "/test/project"
    );

    const mcpStep = report.steps.find(
      (step) =>
        step.title.toLowerCase().includes("mcp") ||
        step.title.toLowerCase().includes("server")
    );

    expect(mcpStep).toBeDefined();
    expect(
      mcpStep.actions.some((action) =>
        action.includes("claude_desktop_config.json")
      )
    ).toBe(true);
  });

  test("REQ-203 - should clearly distinguish between built-in and MCP server features", async () => {
    const report = generateTroubleshootingReport([], null, "/test/project");

    // Healthy state should explain the distinction
    expect(report.message).toContain("built-in");
    expect(report.message).toContain("MCP server");
  });
});

describe("REQ-204 - Revised MCP Server Validation", () => {
  test("REQ-204 - should only validate actual MCP servers", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
        supabase: { command: "npx", args: ["-y", "mcp-server-supabase"] },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/test/config.json");

    // Should validate memory and supabase but NOT filesystem
    expect(validation.validatedServers).toContain("memory");
    expect(validation.validatedServers).toContain("supabase");
    expect(validation.skippedServers).toContain("filesystem");
    expect(validation.skippedServers).toHaveLength(1);
  });

  test("REQ-204 - should skip MCP validation for Filesystem, Context7, Github entirely", async () => {
    const mockConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
        context7: { command: "npx", args: ["-y", "mcp-server-context7"] },
        github: { command: "npx", args: ["-y", "mcp-server-github"] },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/test/config.json");

    expect(validation.skippedServers).toContain("filesystem");
    expect(validation.skippedServers).toContain("context7");
    expect(validation.skippedServers).toContain("github");
    expect(validation.validatedServers).toContain("memory");
    expect(validation.validatedServers).toHaveLength(1);
  });

  test("REQ-204 - should maintain existing MCP validation logic for legitimate servers", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        "invalid-server": { command: "invalid" },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/test/config.json");

    expect(validation.validatedServers).toContain("memory");
    expect(
      validation.issues.find((i) => i.server === "invalid-server")
    ).toBeDefined();
  });
});

describe("REQ-205 - Updated Setup Documentation", () => {
  test("REQ-205 - should point to correct Settings sections in setup guidance", async () => {
    const analysis = await verifyClaudeSetup("/test/project");

    expect(analysis.setupGuidance).toBeDefined();
    expect(analysis.setupGuidance.filesystem).toContain(
      "Settings → Extensions"
    );
    expect(analysis.setupGuidance.context7).toContain("Settings → Extensions");
    expect(analysis.setupGuidance.github).toContain("Settings → Connectors");
  });

  test("REQ-205 - should explain built-in vs MCP server distinction", async () => {
    const analysis = await verifyClaudeSetup("/test/project");

    expect(analysis.architectureExplanation).toBeDefined();
    expect(analysis.architectureExplanation).toContain("built-in");
    expect(analysis.architectureExplanation).toContain("MCP server");
    expect(analysis.architectureExplanation).toContain("Extensions");
    expect(analysis.architectureExplanation).toContain("Connectors");
  });

  test("REQ-205 - should not provide incorrect MCP configuration advice for built-ins", async () => {
    const analysis = await verifyClaudeSetup("/test/project");

    // Built-in tools should not reference MCP configuration
    expect(analysis.setupGuidance.filesystem).not.toContain(
      "claude_desktop_config.json"
    );
    expect(analysis.setupGuidance.context7).not.toContain("mcpServers");
    expect(analysis.setupGuidance.github).not.toContain("MCP server");
  });
});

describe("REQ-206 - Backward Compatibility", () => {
  test("REQ-206 - should continue to work with existing MCP server configurations", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        supabase: { command: "npx", args: ["-y", "mcp-server-supabase"] },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    fs.access.mockResolvedValue();

    const analysis = await verifyClaudeSetup("/test/project");

    expect(analysis.success).toBe(true);
    expect(analysis.mcpServers.memory).toBeDefined();
    expect(analysis.mcpServers.supabase).toBeDefined();
  });

  test("REQ-206 - should gracefully handle existing incorrect configurations", async () => {
    const mockConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    fs.access.mockResolvedValue();

    const analysis = await verifyClaudeSetup("/test/project");

    // Should not error, should provide migration guidance
    expect(analysis.success).toBe(true);
    expect(analysis.migrationGuidance).toBeDefined();
    expect(analysis.migrationGuidance.filesystem).toContain("built-in");
  });

  test("REQ-206 - should not introduce breaking changes to legitimate MCP validation", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
          env: { MEMORY_SIZE: "1GB" },
        },
      },
    };

    fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));
    fs.access.mockResolvedValue();

    const analysis = await verifyClaudeSetup("/test/project");

    expect(analysis.mcpServers.memory.validated).toBe(true);
    expect(analysis.mcpServers.memory.configuration.env.MEMORY_SIZE).toBe(
      "1GB"
    );
  });
});

// Test helpers - moved to individual describe blocks to avoid global interference
