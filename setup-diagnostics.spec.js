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
} from "./setup-diagnostics.js";

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
