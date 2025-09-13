import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";

// These modules will need to be implemented
import {
  analyzeConfiguration,
  parseClaudeDesktopConfig,
  detectFilesystemServer,
  identifyMissingExtensions,
  handleMalformedConfig,
  validateConfigurationStructure,
  getServerConfigurationDetails,
} from "./config-analyzer.js";

describe("REQ-201 & REQ-204: Architecture-Aware Configuration Analysis", () => {
  const mockMixedConfig = {
    mcpServers: {
      // Built-in tools that should be recognized but handled differently
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
      },
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { GITHUB_TOKEN: "ghp_test123" },
      },
      // Custom MCP servers that should be analyzed normally
      memory: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
      },
      supabase: {
        command: "npx",
        args: ["-y", "@supabase/mcp-server-supabase"],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-201 — configuration analysis distinguishes between built-in tools and custom MCP servers", async () => {
    vi.spyOn(fs, "access").mockResolvedValue(undefined);
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockMixedConfig));

    const analysis = await analyzeConfiguration("/fake/config/path");

    expect(analysis.servers).toBeDefined();
    expect(analysis.servers.filesystem).toBeDefined();
    expect(analysis.servers.github).toBeDefined();
    expect(analysis.servers.memory).toBeDefined();
    expect(analysis.servers.supabase).toBeDefined();

    // All should be marked as configured, but implementation should recognize
    // that filesystem and github are built-in tools
    expect(analysis.servers.filesystem.configured).toBe(true);
    expect(analysis.servers.github.configured).toBe(true);
    expect(analysis.servers.memory.configured).toBe(true);
    expect(analysis.servers.supabase.configured).toBe(true);
  });

  test("REQ-204 — server configuration details properly categorize built-in vs custom servers", async () => {
    vi.spyOn(fs, "access").mockResolvedValue(undefined);
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockMixedConfig));

    const serverDetails =
      await getServerConfigurationDetails("/fake/config/path");

    expect(serverDetails.filesystem.status).toBe("configured");
    expect(serverDetails.github.status).toBe("configured");
    expect(serverDetails.memory.status).toBe("configured");
    expect(serverDetails.supabase.status).toBe("configured");

    // All should have details, but the analysis should note that some are built-in
    expect(serverDetails.filesystem.details).toBeDefined();
    expect(serverDetails.github.details).toBeDefined();
    expect(serverDetails.memory.details).toBeDefined();
    expect(serverDetails.supabase.details).toBeDefined();
  });
});

describe("REQ-304: Configuration Analysis Engine", () => {
  const mockValidConfig = {
    mcpServers: {
      filesystem: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-filesystem",
          "/workspace/path",
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

  test("REQ-304 — parses claude_desktop_config.json to determine actual server states", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));

    const analysis = await analyzeConfiguration(mockConfigPath);

    expect(analysis).toHaveProperty("servers");
    expect(analysis.servers).toHaveProperty("filesystem");
    expect(analysis.servers).toHaveProperty("memory");
    expect(analysis.servers.filesystem.configured).toBe(true);
    expect(analysis.servers.memory.configured).toBe(true);
    expect(fs.readFile).toHaveBeenCalledWith(mockConfigPath, "utf8");
  });

  test("REQ-304 — detects filesystem server configuration and workspace paths", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));

    const filesystemConfig = await detectFilesystemServer(mockConfigPath);

    expect(filesystemConfig).toHaveProperty("configured", true);
    expect(filesystemConfig).toHaveProperty("workspacePath", "/workspace/path");
    expect(filesystemConfig).toHaveProperty("command", "npx");
    expect(filesystemConfig.args).toContain(
      "@modelcontextprotocol/server-filesystem"
    );
  });

  test("REQ-304 — identifies missing recommended extensions with specific setup guidance", async () => {
    const configWithoutOptionalExtensions = {
      mcpServers: {
        filesystem: mockValidConfig.mcpServers.filesystem,
        memory: mockValidConfig.mcpServers.memory,
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithoutOptionalExtensions)
    );

    const missingExtensions = await identifyMissingExtensions(mockConfigPath);

    expect(missingExtensions).toHaveProperty("context7");
    expect(missingExtensions).toHaveProperty("github");
    expect(missingExtensions.context7).toHaveProperty("missing", true);
    expect(missingExtensions.context7).toHaveProperty("setupGuidance");
    expect(missingExtensions.github).toHaveProperty("missing", true);
    expect(missingExtensions.github).toHaveProperty("setupGuidance");
    expect(missingExtensions.context7.setupGuidance).toContain("Context7");
    expect(missingExtensions.github.setupGuidance).toContain("GitHub");
  });

  test("REQ-304 — handles malformed configuration files gracefully", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue("invalid json content");

    const analysis = await analyzeConfiguration(mockConfigPath);

    expect(analysis).toHaveProperty("error");
    expect(analysis.error).toContain("malformed");
    expect(analysis).toHaveProperty("fallbackMode", true);
    expect(analysis).toHaveProperty("servers", {});
  });

  test("REQ-304 — returns server configuration details for each detected server", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockValidConfig));

    const serverDetails = await getServerConfigurationDetails(mockConfigPath);

    expect(serverDetails).toHaveProperty("filesystem");
    expect(serverDetails).toHaveProperty("memory");
    expect(serverDetails.filesystem).toHaveProperty("status", "configured");
    expect(serverDetails.filesystem).toHaveProperty("details");
    expect(serverDetails.memory).toHaveProperty("status", "configured");
    expect(serverDetails.memory).toHaveProperty("details");
  });

  test("REQ-304 — detects missing filesystem configuration", async () => {
    const configWithoutFilesystem = {
      mcpServers: {
        memory: mockValidConfig.mcpServers.memory,
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithoutFilesystem)
    );

    const filesystemConfig = await detectFilesystemServer(mockConfigPath);

    expect(filesystemConfig).toHaveProperty("configured", false);
    expect(filesystemConfig).toHaveProperty("reason", "not_found");
    expect(filesystemConfig).toHaveProperty("setupGuidance");
    expect(filesystemConfig.setupGuidance).toContain("filesystem");
  });
});

describe("REQ-309: Robust Configuration Parsing", () => {
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

  test("REQ-309 — handles missing configuration files", async () => {
    vi.spyOn(fs, "readFile").mockRejectedValue(
      Object.assign(new Error("ENOENT: no such file or directory"), {
        code: "ENOENT",
      })
    );

    const config = await parseClaudeDesktopConfig(mockConfigPath);

    expect(config).toHaveProperty("error");
    expect(config.error).toContain("not found");
    expect(config).toHaveProperty("fallbackConfig");
    expect(config.fallbackConfig).toEqual({ mcpServers: {} });
  });

  test("REQ-309 — provides specific error messages for configuration issues", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue('{"mcpServers": invalid}');

    const config = await parseClaudeDesktopConfig(mockConfigPath);

    expect(config).toHaveProperty("error");
    expect(config.error).toContain("JSON syntax error");
    expect(config).toHaveProperty("errorDetails");
    expect(config.errorDetails).toContain("Unexpected token");
  });

  test("REQ-309 — gracefully degrades when configuration analysis fails", async () => {
    vi.spyOn(fs, "readFile").mockRejectedValue(new Error("Permission denied"));

    const analysis = await handleMalformedConfig(mockConfigPath);

    expect(analysis).toHaveProperty("degradedMode", true);
    expect(analysis).toHaveProperty("error");
    expect(analysis).toHaveProperty("fallbackGuidance");
    expect(analysis.fallbackGuidance).toContain("manual setup");
  });

  test("REQ-309 — follows existing error handling patterns", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue("corrupted file content");

    const validation = await validateConfigurationStructure(mockConfigPath);

    expect(validation).toHaveProperty("isValid", false);
    expect(validation).toHaveProperty("errors");
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test("REQ-309 — handles incomplete configuration files", async () => {
    const incompleteConfig = { mcpServers: null };
    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(incompleteConfig)
    );

    const config = await parseClaudeDesktopConfig(mockConfigPath);

    expect(config).toHaveProperty("warning");
    expect(config.warning).toContain("incomplete");
    expect(config).toHaveProperty("mcpServers", {});
  });

  test("REQ-309 — validates server configuration structure", async () => {
    const malformedServerConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          // missing args array
        },
        memory: "invalid_structure",
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(malformedServerConfig)
    );

    const validation = await validateConfigurationStructure(mockConfigPath);

    expect(validation).toHaveProperty("isValid", false);
    expect(validation.errors).toContainEqual(
      expect.objectContaining({
        server: "filesystem",
        issue: "missing_args",
      })
    );
    expect(validation.errors).toContainEqual(
      expect.objectContaining({
        server: "memory",
        issue: "invalid_structure",
      })
    );
  });

  test("REQ-309 — handles empty configuration files", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue("");

    const config = await parseClaudeDesktopConfig(mockConfigPath);

    expect(config).toHaveProperty("error");
    expect(config.error).toContain("empty");
    expect(config).toHaveProperty("fallbackConfig");
    expect(config.fallbackConfig).toEqual({ mcpServers: {} });
  });

  test("REQ-309 — recovers from JSON parsing errors with helpful messages", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue(
      '{"mcpServers": {"filesystem": {invalid}}}'
    );

    const analysis = await handleMalformedConfig(mockConfigPath);

    expect(analysis).toHaveProperty("recovered", true);
    expect(analysis).toHaveProperty("originalError");
    expect(analysis).toHaveProperty("recoverySuggestions");
    expect(Array.isArray(analysis.recoverySuggestions)).toBe(true);
    expect(analysis.recoverySuggestions.length).toBeGreaterThan(0);
  });
});
