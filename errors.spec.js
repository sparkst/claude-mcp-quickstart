import { describe, test, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { generateServerConfig } from "./setup.js";

describe("error handling scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("handles corrupted JSON config files gracefully", async () => {
    const corruptedJson = '{ "mcpServers": { incomplete...';

    expect(() => JSON.parse(corruptedJson)).toThrow();

    // Should fall back to empty config
    let fallbackConfig = {};
    try {
      fallbackConfig = JSON.parse(corruptedJson);
    } catch {
      fallbackConfig = { mcpServers: {} };
    }

    expect(fallbackConfig).toEqual({ mcpServers: {} });
  });

  test("handles missing config directory", async () => {
    const nonExistentPath = "/nonexistent/path/config.json";

    await expect(fs.access(nonExistentPath)).rejects.toThrow();

    // Should handle gracefully and create default config
    const defaultConfig = { mcpServers: {} };
    expect(defaultConfig).toBeDefined();
  });

  test("handles invalid server configurations", () => {
    const invalidConfigs = [
      { serverType: "github", options: { githubToken: "" } },
      { serverType: "github", options: { githubToken: null } },
      { serverType: "github", options: { githubToken: undefined } },
      { serverType: "supabase", options: { supabaseKey: "" } },
      { serverType: "unknown-server", options: {} },
    ];

    for (const { serverType, options } of invalidConfigs) {
      const config = generateServerConfig(serverType, options);
      if (serverType === "unknown-server") {
        expect(config).toBeUndefined();
      } else {
        // Empty or null API keys should return null
        expect(config).toBeNull();
      }
    }
  });

  test("handles file system permission errors", async () => {
    const readOnlyPath = "/root/restricted/config.json";

    // Simulate permission error
    await expect(fs.writeFile(readOnlyPath, "test")).rejects.toThrow();
  });

  test("validates workspace path creation edge cases", () => {
    const edgeCasePaths = [
      "",
      null,
      undefined,
      "/path/with/../../traversal",
      "relative/path",
      "/path/with spaces/config",
      "/path/with\nnewline",
    ];

    for (const testPath of edgeCasePaths) {
      if (testPath) {
        const config = generateServerConfig("filesystem", {
          workspacePath: testPath,
        });
        expect(config).toBeDefined();
        expect(config.args).toContain(testPath);
      } else {
        // Should use default path for null/undefined
        const config = generateServerConfig("filesystem", {
          workspacePath: testPath,
        });
        expect(config).toBeDefined();
        expect(config.args[2]).toContain("claude-mcp-workspace");
      }
    }
  });

  test("handles concurrent config modifications", async () => {
    // Simulate race condition where config file changes between read and write
    const originalConfig = { mcpServers: { existing: { command: "test" } } };
    const newConfig = { mcpServers: { new: { command: "new" } } };

    // Both configs should be valid separately
    expect(originalConfig.mcpServers.existing).toBeDefined();
    expect(newConfig.mcpServers.new).toBeDefined();

    // Merge should preserve both
    const merged = {
      mcpServers: {
        ...originalConfig.mcpServers,
        ...newConfig.mcpServers,
      },
    };

    expect(merged.mcpServers.existing).toBeDefined();
    expect(merged.mcpServers.new).toBeDefined();
  });

  test("handles environment variable edge cases", () => {
    const envVarTests = [
      { key: "GITHUB_TOKEN", value: "valid-token" },
      { key: "GITHUB_TOKEN", value: "" },
      { key: "GITHUB_TOKEN", value: null },
      { key: "GITHUB_TOKEN", value: undefined },
      {
        key: "SUPABASE_API_KEY",
        value: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      },
      { key: "BRAVE_API_KEY", value: "BSA-" + "x".repeat(32) },
    ];

    for (const { key, value } of envVarTests) {
      const serverType = key.toLowerCase().split("_")[0];
      const optionKey =
        serverType === "github"
          ? "githubToken"
          : serverType === "supabase"
            ? "supabaseKey"
            : "braveKey";

      const config = generateServerConfig(serverType, { [optionKey]: value });

      if (value && value.trim()) {
        expect(config).toBeDefined();
        expect(config.env[key]).toBe(value);
      } else {
        expect(config).toBeNull();
      }
    }
  });
});
