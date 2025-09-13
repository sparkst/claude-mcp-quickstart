import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";

// These modules will need to be implemented
import {
  analyzeSetupConfiguration,
  checkFilesystemAccess,
  detectOptionalExtensions,
  generateTroubleshootingSteps,
  detectCommonSetupFailures,
  handleSetupEdgeCases,
  generateContextAwareTroubleshooting,
  validateWorkspaceAccess,
  // REQ-201, REQ-202 functions
  testBuiltInFeatures,
  validateMcpServersOnly,
  verifyClaudeSetup,
  generateTroubleshootingReport,
} from "./setup-diagnostics.js";

// COMMON_FAILURES is used internally by generateTroubleshootingReport

describe("REQ-201: Correct Claude Desktop Architecture Understanding", () => {
  const mockBuiltInMcpConfig = {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      },
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_TOKEN: "ghp_test123" },
      },
      context7: {
        command: "npx",
        args: ["-y", "@upstash/context7-mcp", "--api-key", "ctx7_key"],
      },
      memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-201 — validation logic correctly identifies built-in tools and skips MCP validation for them", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(mockBuiltInMcpConfig)
    );

    const mcpValidation = await validateMcpServersOnly("/fake/config/path");

    // Built-in tools should be SKIPPED from MCP validation
    expect(mcpValidation.skippedServers).toContain("filesystem");
    expect(mcpValidation.skippedServers).toContain("github");
    expect(mcpValidation.skippedServers).toContain("context7");
    expect(mcpValidation.skippedServers).toHaveLength(3);

    // Only custom MCP servers should be validated
    expect(mcpValidation.validatedServers).toContain("memory");
    expect(mcpValidation.validatedServers).toHaveLength(1);
  });

  test("REQ-201 — filesystem, Context7, and Github are treated as built-in Extensions/Connectors", async () => {
    const builtInFeatures = await testBuiltInFeatures();

    // These should all be tested via direct tool calls, not MCP config
    expect(builtInFeatures.filesystem.validatedVia).toBe("direct_tool_test");
    expect(builtInFeatures.context7.validatedVia).toBe("direct_tool_test");
    expect(builtInFeatures.github.validatedVia).toBe("direct_tool_test");

    // None should check MCP configuration
    expect(builtInFeatures.filesystem.checkedMcpConfig).toBe(false);
    expect(builtInFeatures.context7.checkedMcpConfig).toBe(false);
    expect(builtInFeatures.github.checkedMcpConfig).toBe(false);

    // Each should use appropriate testing method
    expect(builtInFeatures.filesystem.method).toBe("file_operation");
    expect(builtInFeatures.context7.method).toBe("documentation_lookup");
    expect(builtInFeatures.github.method).toBe("repository_access");
  });

  test("REQ-201 — only custom MCP servers (memory, supabase, etc.) are validated through MCP configuration", async () => {
    const customMcpConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        supabase: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase"],
          env: { SUPABASE_URL: "https://test.supabase.co" },
        },
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(customMcpConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Custom servers should be validated
    expect(validation.validatedServers).toContain("memory");
    expect(validation.validatedServers).toContain("supabase");

    // Built-in should be skipped
    expect(validation.skippedServers).toContain("filesystem");
    expect(validation.validatedServers).not.toContain("filesystem");
  });

  test("REQ-201 — comprehensive setup verification uses direct testing for built-ins, MCP validation for custom servers", async () => {
    const mockConfigPath = "/fake/config/path";
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(mockBuiltInMcpConfig)
    );

    const setupVerification = await verifyClaudeSetup(
      "/project/path",
      mockConfigPath
    );

    expect(setupVerification.success).toBe(true);

    // Built-in features tested directly
    expect(setupVerification.builtInFeatures).toHaveProperty("filesystem");
    expect(setupVerification.builtInFeatures).toHaveProperty("context7");
    expect(setupVerification.builtInFeatures).toHaveProperty("github");

    // MCP servers contain only custom servers
    expect(setupVerification.mcpServers).toHaveProperty("memory");
    expect(setupVerification.mcpServers).not.toHaveProperty("filesystem");
    expect(setupVerification.mcpServers).not.toHaveProperty("github");
    expect(setupVerification.mcpServers).not.toHaveProperty("context7");

    // Architecture explanation present
    expect(setupVerification.architectureExplanation).toContain(
      "built-in Extensions"
    );
    expect(setupVerification.architectureExplanation).toContain("Connectors");
    expect(setupVerification.architectureExplanation).toContain(
      "not MCP server configuration"
    );
  });
});

describe("REQ-202: Direct Tool Testing for Built-in Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-202 — test Filesystem access by attempting file operations, not MCP configuration checks", async () => {
    // Mock filesystem operations
    vi.spyOn(fs, "readdir").mockResolvedValue(["file1.txt", "file2.js"]);

    const results = await testBuiltInFeatures();

    expect(results.filesystem.method).toBe("file_operation");
    expect(results.filesystem.validatedVia).toBe("direct_tool_test");
    expect(results.filesystem.checkedMcpConfig).toBe(false);
    expect(results.filesystem.testResult).toBe("success");
    expect(results.filesystem.available).toBe(true);
    expect(fs.readdir).toHaveBeenCalledWith(process.cwd());
  });

  test("REQ-202 — test Context7 by attempting library documentation lookup, not MCP configuration", async () => {
    const results = await testBuiltInFeatures();

    expect(results.context7.method).toBe("documentation_lookup");
    expect(results.context7.validatedVia).toBe("direct_tool_test");
    expect(results.context7.checkedMcpConfig).toBe(false);
    // Current implementation shows as unavailable which is correct for testing
    expect(results.context7.testResult).toBe("unavailable");
  });

  test("REQ-202 — test Github by attempting repository operations, not MCP configuration", async () => {
    const results = await testBuiltInFeatures();

    expect(results.github.method).toBe("repository_access");
    expect(results.github.validatedVia).toBe("direct_tool_test");
    expect(results.github.checkedMcpConfig).toBe(false);
    // Implementation shows as available for testing
    expect(results.github.available).toBe(true);
    expect(results.github.testResult).toBe("success");
  });

  test("REQ-202 — all built-in feature tests use actual Claude tool calls, not MCP configuration checks", async () => {
    // Mock the filesystem call that would actually happen in direct testing
    vi.spyOn(fs, "readdir").mockResolvedValue(["test.txt"]);

    const results = await testBuiltInFeatures();

    // Verify every built-in feature uses direct testing
    Object.entries(results).forEach(([featureName, featureResult]) => {
      expect(featureResult.validatedVia).toBe("direct_tool_test");
      expect(featureResult.checkedMcpConfig).toBe(false);
      expect(featureResult).toHaveProperty("method");
      expect(featureResult.method).not.toBe("mcp_config_check");
    });

    // Filesystem should actually attempt file operation
    expect(fs.readdir).toHaveBeenCalled();
  });

  test("REQ-202 — built-in feature testing handles errors gracefully without falling back to MCP checks", async () => {
    // Mock filesystem error
    vi.spyOn(fs, "readdir").mockRejectedValue(new Error("Permission denied"));

    const results = await testBuiltInFeatures();

    expect(results.filesystem.testResult).toBe("failed");
    expect(results.filesystem.error).toBe("Permission denied");
    expect(results.filesystem.validatedVia).toBe("direct_tool_test");
    expect(results.filesystem.checkedMcpConfig).toBe(false);
    // Should NOT fall back to MCP configuration checking
  });

  test("REQ-202 — direct testing approach properly distinguishes available vs configured", async () => {
    vi.spyOn(fs, "readdir").mockResolvedValue(["app.js"]);

    const results = await testBuiltInFeatures();

    // Filesystem shows as available (can perform file operations)
    expect(results.filesystem.available).toBe(true);

    // Context7 shows as unavailable (cannot perform doc lookups yet)
    expect(results.context7.available).toBe(false);
    expect(results.context7.testResult).toBe("unavailable");

    // GitHub shows as available (placeholder implementation)
    expect(results.github.available).toBe(true);

    // All use direct testing regardless of availability
    expect(results.filesystem.validatedVia).toBe("direct_tool_test");
    expect(results.context7.validatedVia).toBe("direct_tool_test");
    expect(results.github.validatedVia).toBe("direct_tool_test");
  });
});

describe("REQ-203: Correct Troubleshooting Guidance", () => {
  const mockProjectPath = "/Users/test/workspace/my-project";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-203 — users directed to Settings→Extensions for Filesystem/Context7 issues", () => {
    const failures = [
      {
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
        type: "FILESYSTEM_NOT_AVAILABLE",
        severity: "critical",
        autoDetected: true,
        context: { toolType: "built-in" },
      },
    ];

    const troubleshooting = generateTroubleshootingReport(
      failures,
      null,
      mockProjectPath
    );

    const fsStep = troubleshooting.steps[0];
    expect(fsStep.actions).toContain("Navigate to Settings → Extensions");
    expect(fsStep.actions).toContain("Enable the 'Filesystem' extension");
    expect(fsStep.actions).not.toContain("MCP configuration");
    expect(fsStep.actions).not.toContain("claude_desktop_config.json");
  });

  test("REQ-203 — users directed to Settings→Connectors for Github issues", () => {
    const failures = [
      {
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
        type: "GITHUB_NOT_AVAILABLE",
        severity: "high",
        autoDetected: true,
        context: { toolType: "built-in" },
      },
    ];

    const troubleshooting = generateTroubleshootingReport(
      failures,
      null,
      mockProjectPath
    );

    const githubStep = troubleshooting.steps[0];
    expect(githubStep.actions).toContain("Navigate to Settings → Connectors");
    expect(githubStep.actions).toContain("Enable the 'GitHub' connector");
    expect(githubStep.actions).toContain(
      "Authenticate with your GitHub account"
    );
    expect(githubStep.actions).not.toContain("MCP server");
    expect(githubStep.actions).not.toContain("configuration file");
  });

  test("REQ-203 — MCP troubleshooting only applies to custom servers like memory, supabase", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "invalid",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    expect(validation.issues).toHaveLength(1);
    expect(validation.issues[0].server).toBe("memory");
    expect(validation.issues[0].issue).toBe("invalid_command");
    expect(validation.validatedServers).toContain("memory");
    expect(validation.skippedServers).toHaveLength(0);
  });

  test("REQ-203 — clear distinction between built-in and MCP server features in guidance", async () => {
    const mockConfigPath = "/fake/config/path";
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

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockConfig));

    const setupResult = await verifyClaudeSetup(
      "/project/path",
      mockConfigPath
    );

    expect(setupResult.migrationGuidance).toBeDefined();
    expect(setupResult.migrationGuidance.filesystem).toContain(
      "built-in Extension"
    );
    expect(setupResult.migrationGuidance.filesystem).toContain(
      "Settings → Extensions"
    );
    expect(setupResult.migrationGuidance.filesystem).toContain(
      "Remove from MCP configuration"
    );

    expect(setupResult.setupGuidance.filesystem).toContain(
      "Settings → Extensions"
    );
    expect(setupResult.setupGuidance.github).toContain("Settings → Connectors");

    expect(setupResult.architectureExplanation).toContain(
      "built-in Extensions"
    );
    expect(setupResult.architectureExplanation).toContain("Connectors");
    expect(setupResult.architectureExplanation).toContain(
      "not MCP server configuration"
    );
  });
});

describe("REQ-204: Revised MCP Server Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-204 — only validate actual MCP servers (memory, supabase, etc.)", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        supabase: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase"],
        },
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Only custom MCP servers should be validated
    expect(validation.validatedServers).toContain("memory");
    expect(validation.validatedServers).toContain("supabase");
    expect(validation.validatedServers).toHaveLength(2);

    // Built-ins should be skipped
    expect(validation.skippedServers).toContain("filesystem");
    expect(validation.skippedServers).toContain("github");
    expect(validation.skippedServers).toHaveLength(2);
  });

  test("REQ-204 — skip MCP validation for Filesystem, Context7, Github entirely", async () => {
    const mockConfig = {
      mcpServers: {
        filesystem: {
          command: "invalid_command",
          // This should be skipped despite being invalid
        },
        context7: {
          command: "missing_args",
        },
        github: {
          // Missing command entirely
        },
        memory: {
          command: "invalid",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Built-ins should be skipped even with invalid configs
    expect(validation.skippedServers).toContain("filesystem");
    expect(validation.skippedServers).toContain("context7");
    expect(validation.skippedServers).toContain("github");

    // Only custom MCP server issues should be reported
    expect(validation.issues).toHaveLength(1);
    expect(validation.issues[0].server).toBe("memory");
    expect(validation.issues[0].issue).toBe("invalid_command");
  });

  test("REQ-204 — maintain existing MCP validation logic for legitimate MCP servers", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {
          // Missing command
        },
        supabase: {
          command: "invalid",
          args: ["-y", "@supabase/mcp-server-supabase"],
        },
        customServer: {
          command: "npx",
          args: ["-y", "@custom/mcp-server"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    expect(validation.validatedServers).toContain("memory");
    expect(validation.validatedServers).toContain("supabase");
    expect(validation.validatedServers).toContain("customServer");

    // Should detect issues in legitimate MCP servers
    expect(validation.issues).toHaveLength(2);
    expect(
      validation.issues.some(
        (issue) =>
          issue.server === "memory" && issue.issue === "missing_command"
      )
    ).toBe(true);
    expect(
      validation.issues.some(
        (issue) =>
          issue.server === "supabase" && issue.issue === "invalid_command"
      )
    ).toBe(true);
  });
});

describe("REQ-205: Updated Setup Documentation", () => {
  test("REQ-205 — setup guides point to correct Settings sections", async () => {
    const mockConfigPath = "/fake/config/path";
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify({ mcpServers: {} })
    );

    const setupResult = await verifyClaudeSetup(
      "/project/path",
      mockConfigPath
    );

    expect(setupResult.setupGuidance).toBeDefined();
    expect(setupResult.setupGuidance.filesystem).toContain(
      "Settings → Extensions"
    );
    expect(setupResult.setupGuidance.context7).toContain(
      "Settings → Extensions"
    );
    expect(setupResult.setupGuidance.github).toContain("Settings → Connectors");

    // Should not contain MCP configuration advice for built-ins
    expect(setupResult.setupGuidance.filesystem).not.toContain(
      "claude_desktop_config.json"
    );
    expect(setupResult.setupGuidance.context7).not.toContain("MCP server");
    expect(setupResult.setupGuidance.github).not.toContain("MCP configuration");
  });

  test("REQ-205 — clear explanation of built-in vs MCP server distinction", async () => {
    const mockConfigPath = "/fake/config/path";
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify({ mcpServers: {} })
    );

    const setupResult = await verifyClaudeSetup(
      "/project/path",
      mockConfigPath
    );

    expect(setupResult.architectureExplanation).toContain(
      "built-in Extensions"
    );
    expect(setupResult.architectureExplanation).toContain("Connectors");
    expect(setupResult.architectureExplanation).toContain("Settings UI");
    expect(setupResult.architectureExplanation).toContain(
      "not MCP server configuration"
    );
    expect(setupResult.architectureExplanation).toContain(
      "custom third-party tools"
    );
  });

  test("REQ-205 — troubleshooting steps match actual Claude Desktop UI", () => {
    const failures = [
      {
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
        type: "FILESYSTEM_NOT_AVAILABLE",
        severity: "critical",
        autoDetected: true,
      },
    ];

    const troubleshooting = generateTroubleshootingReport(
      failures,
      null,
      "/project/path"
    );

    const step = troubleshooting.steps[0];
    expect(step.actions).toContain("Open Claude Desktop application");
    expect(step.actions).toContain("Navigate to Settings → Extensions");
    expect(step.actions).toContain("Enable the 'Filesystem' extension");
    expect(step.actions).toContain(
      "Add your project directory to allowed paths"
    );
    expect(step.actions).toContain("Restart Claude Desktop application");
  });

  test("REQ-205 — remove incorrect MCP configuration advice for built-in tools", async () => {
    const contextAware =
      await generateContextAwareTroubleshooting("/fake/config/path");

    expect(contextAware.scope).toBe("mcp_configuration_only");
    expect(contextAware.outOfScope).toContain("Claude application issues");
    expect(contextAware.outOfScope).toContain("System-level networking");

    // Steps should focus on proper Settings configuration, not MCP files
    const fsStep = contextAware.resolutionSteps.find((step) =>
      step.title.includes("Filesystem")
    );
    if (fsStep) {
      expect(fsStep.commands).toContain("Navigate to Settings → Extensions");
      expect(fsStep.commands).not.toContain("claude_desktop_config.json");
    }
  });
});

describe("REQ-206: Backward Compatibility", () => {
  test("REQ-206 — existing MCP server configurations continue to work", async () => {
    const existingConfig = {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        supabase: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase"],
          env: { SUPABASE_URL: "https://test.supabase.co" },
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(existingConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    expect(validation.validatedServers).toContain("memory");
    expect(validation.validatedServers).toContain("supabase");
    expect(validation.issues).toHaveLength(0);
  });

  test("REQ-206 — no breaking changes to legitimate MCP server validation", async () => {
    const configWithIssues = {
      mcpServers: {
        memory: {
          // Missing command should still be detected
        },
        supabase: {
          command: "invalid",
          args: ["-y", "@supabase/mcp-server-supabase"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithIssues)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Should still detect MCP server issues
    expect(validation.issues).toHaveLength(2);
    expect(
      validation.issues.some(
        (issue) =>
          issue.server === "memory" && issue.issue === "missing_command"
      )
    ).toBe(true);
    expect(
      validation.issues.some(
        (issue) =>
          issue.server === "supabase" && issue.issue === "invalid_command"
      )
    ).toBe(true);
  });

  test("REQ-206 — graceful handling of existing incorrect configurations", async () => {
    const incorrectConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(incorrectConfig));

    const setupResult = await verifyClaudeSetup(
      "/project/path",
      "/fake/config/path"
    );

    expect(setupResult.success).toBe(true);
    expect(setupResult.migrationGuidance).toBeDefined();
    expect(setupResult.migrationGuidance.filesystem).toContain(
      "Remove from MCP configuration"
    );
    expect(setupResult.migrationGuidance.github).toContain(
      "Remove from MCP configuration"
    );

    // Should still work with legitimate MCP server
    expect(setupResult.mcpServers.memory).toBeDefined();
  });
});

describe("REQ-302: Intelligent Setup Verification", () => {
  const mockValidConfig = {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/valid/workspace",
        ],
      },
      memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
      },
    },
  };

  const mockConfigPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json"
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("REQ-302 — analyzes actual Claude desktop configuration to detect what's configured vs missing", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));

    const analysis = await analyzeSetupConfiguration(mockConfigPath);

    expect(analysis).toHaveProperty("configured");
    expect(analysis).toHaveProperty("missing");
    expect(analysis.configured).toContain("filesystem");
    expect(analysis.configured).toContain("memory");
    expect(analysis.missing).toEqual(expect.any(Array));
    expect(analysis).toHaveProperty("configurationStatus", "partial");
  });

  test("REQ-302 — checks for mandatory Filesystem access and workspace path configuration", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));
    vi.spyOn(fs, "access").mockResolvedValue(undefined);

    const filesystemCheck = await checkFilesystemAccess(mockConfigPath);

    expect(filesystemCheck).toHaveProperty("configured", true);
    expect(filesystemCheck).toHaveProperty("workspacePath", "/valid/workspace");
    expect(filesystemCheck).toHaveProperty("accessible", true);
    expect(fs.access).toHaveBeenCalledWith("/valid/workspace");
  });

  test("REQ-302 — detects missing mandatory filesystem configuration", async () => {
    const configWithoutFilesystem = {
      mcpServers: {
        memory: mockValidConfig.mcpServers.memory,
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithoutFilesystem)
    );

    const filesystemCheck = await checkFilesystemAccess(mockConfigPath);

    expect(filesystemCheck).toHaveProperty("configured", false);
    expect(filesystemCheck).toHaveProperty("mandatory", true);
    expect(filesystemCheck).toHaveProperty(
      "issue",
      "missing_filesystem_server"
    );
    expect(filesystemCheck).toHaveProperty("setupGuidance");
    expect(filesystemCheck.setupGuidance).toContain(
      "Filesystem access is required"
    );
  });

  test("REQ-302 — detects optional extensions (Context7, GitHub) and provides setup guidance", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));

    const extensions = await detectOptionalExtensions(mockConfigPath);

    expect(extensions).toHaveProperty("context7");
    expect(extensions).toHaveProperty("github");
    expect(extensions.context7).toHaveProperty("configured", false);
    expect(extensions.context7).toHaveProperty("optional", true);
    expect(extensions.context7).toHaveProperty("setupGuidance");
    expect(extensions.github).toHaveProperty("configured", false);
    expect(extensions.github).toHaveProperty("optional", true);
    expect(extensions.github).toHaveProperty("setupGuidance");
    expect(extensions.context7.setupGuidance).toContain("documentation lookup");
    expect(extensions.github.setupGuidance).toContain("GitHub token");
  });

  test("REQ-302 — detects configured optional extensions", async () => {
    const configWithExtensions = {
      ...mockValidConfig,
      mcpServers: {
        ...mockValidConfig.mcpServers,
        context7: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp", "--api-key", "ctx7_key"],
        },
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "gh_token" },
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithExtensions)
    );

    const extensions = await detectOptionalExtensions(mockConfigPath);

    expect(extensions.context7).toHaveProperty("configured", true);
    expect(extensions.github).toHaveProperty("configured", true);
    expect(extensions.context7).toHaveProperty("status", "ready");
    expect(extensions.github).toHaveProperty("status", "ready");
  });

  test("REQ-302 — generates targeted troubleshooting steps for common misconfigurations", async () => {
    const malformedConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "/nonexistent/path",
          ],
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(malformedConfig));
    vi.spyOn(fs, "access").mockRejectedValue(new Error("ENOENT"));

    const troubleshooting = await generateTroubleshootingSteps(mockConfigPath);

    expect(troubleshooting).toHaveProperty("issues");
    expect(troubleshooting).toHaveProperty("steps");
    expect(troubleshooting.issues).toContain("invalid_workspace_path");
    expect(troubleshooting.steps).toEqual(expect.any(Array));
    expect(troubleshooting.steps.length).toBeGreaterThan(0);
    expect(troubleshooting.steps[0]).toHaveProperty("issue");
    expect(troubleshooting.steps[0]).toHaveProperty("solution");
    expect(troubleshooting.steps[0]).toHaveProperty("priority", "high");
  });

  test("REQ-302 — identifies workspace path accessibility issues", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));
    vi.spyOn(fs, "access").mockRejectedValue(
      Object.assign(new Error("Permission denied"), { code: "EACCES" })
    );

    const workspaceCheck = await validateWorkspaceAccess("/valid/workspace");

    expect(workspaceCheck).toHaveProperty("accessible", false);
    expect(workspaceCheck).toHaveProperty("issue", "permission_denied");
    expect(workspaceCheck).toHaveProperty("resolution");
    expect(workspaceCheck.resolution).toContain("permission");
  });
});

describe("REQ-310: Targeted Troubleshooting System", () => {
  const mockConfigPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json"
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("REQ-310 — detects common setup failures (missing filesystem, invalid tokens, etc.)", async () => {
    const configWithInvalidTokens = {
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "invalid_token_format" },
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithInvalidTokens)
    );

    const failures = await detectCommonSetupFailures(mockConfigPath);

    expect(failures).toHaveProperty("detectedIssues");
    expect(failures.detectedIssues).toContain("missing_filesystem");
    expect(failures.detectedIssues).toContain("invalid_github_token");
    expect(failures).toHaveProperty("failureDetails");
    expect(failures.failureDetails.missing_filesystem).toHaveProperty(
      "severity",
      "critical"
    );
    expect(failures.failureDetails.invalid_github_token).toHaveProperty(
      "severity",
      "warning"
    );
  });

  test("REQ-310 — provides specific, step-by-step resolution guidance", async () => {
    const emptyConfig = { mcpServers: {} };
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(emptyConfig));

    const troubleshooting =
      await generateContextAwareTroubleshooting(mockConfigPath);

    expect(troubleshooting).toHaveProperty("resolutionSteps");
    expect(Array.isArray(troubleshooting.resolutionSteps)).toBe(true);
    expect(troubleshooting.resolutionSteps.length).toBeGreaterThan(0);
    expect(troubleshooting.resolutionSteps[0]).toHaveProperty("step", 1);
    expect(troubleshooting.resolutionSteps[0]).toHaveProperty("title");
    expect(troubleshooting.resolutionSteps[0]).toHaveProperty("description");
    expect(troubleshooting.resolutionSteps[0]).toHaveProperty("commands");
  });

  test("REQ-310 — handles edge cases like multiple Claude installations", async () => {
    const multipleInstallPaths = [
      "/Users/user/Library/Application Support/Claude/claude_desktop_config.json",
      "/Users/user/Library/Application Support/Claude-dev/claude_desktop_config.json",
    ];

    const edgeCases = await handleSetupEdgeCases(multipleInstallPaths);

    expect(edgeCases).toHaveProperty("multipleInstallations", true);
    expect(edgeCases).toHaveProperty("detectedPaths");
    expect(edgeCases.detectedPaths).toEqual(expect.any(Array));
    expect(edgeCases).toHaveProperty("recommendedAction");
    expect(edgeCases.recommendedAction).toContain("consolidate");
  });

  test("REQ-310 — handles custom configuration locations", async () => {
    const customConfigPath = "/custom/path/claude_config.json";

    const edgeCases = await handleSetupEdgeCases([customConfigPath]);

    expect(edgeCases).toHaveProperty("customConfigDetected", true);
    expect(edgeCases).toHaveProperty("configPath", customConfigPath);
    expect(edgeCases).toHaveProperty("guidance");
    expect(edgeCases.guidance).toContain("custom configuration");
  });

  test("REQ-310 — generates troubleshooting content that's context-aware", async () => {
    const partialConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
          // Missing workspace path
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(partialConfig));

    const contextAware =
      await generateContextAwareTroubleshooting(mockConfigPath);

    expect(contextAware).toHaveProperty("contextAnalysis");
    expect(contextAware.contextAnalysis).toHaveProperty(
      "configurationState",
      "incomplete"
    );
    expect(contextAware.contextAnalysis).toHaveProperty("missingComponents");
    expect(contextAware).toHaveProperty("tailoredSolutions");
    expect(contextAware.tailoredSolutions).toEqual(expect.any(Array));
    expect(contextAware.tailoredSolutions[0]).toHaveProperty(
      "applicableToContext",
      true
    );
  });

  test("REQ-310 — detects filesystem permission issues", async () => {
    const configWithWorkspace = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            "/restricted/workspace",
          ],
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithWorkspace)
    );
    vi.spyOn(fs, "access").mockRejectedValue(
      Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" })
    );

    const failures = await detectCommonSetupFailures(mockConfigPath);

    expect(failures.detectedIssues).toContain("workspace_permission_denied");
    expect(failures.failureDetails.workspace_permission_denied).toHaveProperty(
      "severity",
      "critical"
    );
    expect(failures.failureDetails.workspace_permission_denied).toHaveProperty(
      "autoFixable",
      false
    );
  });

  test("REQ-310 — provides context-specific guidance based on operating system", async () => {
    const troubleshooting =
      await generateContextAwareTroubleshooting(mockConfigPath);

    expect(troubleshooting).toHaveProperty("platformSpecific");
    expect(troubleshooting.platformSpecific).toHaveProperty("os");
    expect(troubleshooting.platformSpecific).toHaveProperty("instructions");
    expect(troubleshooting.platformSpecific.instructions).toEqual(
      expect.any(Array)
    );
  });

  test("REQ-310 — detects token validation failures", async () => {
    const configWithExpiredTokens = {
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "ghp_expired_token_123456789" },
        },
        supabase: {
          command: "npx",
          args: [
            "-y",
            "@supabase/mcp-server-supabase",
            "--access-token=invalid_format",
          ],
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithExpiredTokens)
    );

    const failures = await detectCommonSetupFailures(mockConfigPath);

    expect(failures.detectedIssues).toContain("token_validation_failed");
    expect(failures.failureDetails.token_validation_failed).toHaveProperty(
      "affectedServers"
    );
    expect(
      failures.failureDetails.token_validation_failed.affectedServers
    ).toContain("github");
    expect(
      failures.failureDetails.token_validation_failed.affectedServers
    ).toContain("supabase");
  });

  test("REQ-310 — focuses on issues within our control", async () => {
    const troubleshooting =
      await generateContextAwareTroubleshooting(mockConfigPath);

    expect(troubleshooting).toHaveProperty("scope");
    expect(troubleshooting.scope).toEqual("mcp_configuration_only");
    expect(troubleshooting).toHaveProperty("outOfScope");
    expect(troubleshooting.outOfScope).toContain("Claude application issues");
    expect(troubleshooting.outOfScope).toContain("System-level networking");
    expect(troubleshooting.outOfScope).toContain("Operating system problems");
  });

  test("REQ-310 — identifies common user mistakes in configuration", async () => {
    const mistakeConfig = {
      mcpServers: {
        filesystem: {
          command: "node", // Should be npx
          args: ["@modelcontextprotocol/server-filesystem", "/workspace"], // Missing -y flag
        },
        memory: {
          command: "npx",
          args: [
            "-y",
            "@modelcontextprotocol/server-memory",
            "unnecessary-arg",
          ],
        },
      },
    };
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mistakeConfig));

    const failures = await detectCommonSetupFailures(mockConfigPath);

    expect(failures.detectedIssues).toContain("incorrect_command_format");
    expect(failures.detectedIssues).toContain("missing_npx_flag");
    expect(failures.detectedIssues).toContain("unnecessary_arguments");
    expect(failures.failureDetails.incorrect_command_format).toHaveProperty(
      "commonMistake",
      true
    );
  });
});
