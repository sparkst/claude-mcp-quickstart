import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";

// Import the corrected architecture functions
import {
  testBuiltInFeatures,
  validateMcpServersOnly,
  verifyClaudeSetup,
} from "./setup-diagnostics.js";

/**
 * These tests verify that the INCORRECT old approach is NOT being used.
 * If anyone tries to implement the old architecture, these tests will fail.
 */
describe("Architecture Validation: Verify OLD Incorrect Approach is NOT Used", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("REQ-201: Built-in Tools Must NOT Be Validated as MCP Servers", () => {
    test("ARCHITECTURE VALIDATION — filesystem tool must NOT be validated through MCP configuration", async () => {
      const mockConfigWithFilesystem = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: [
              "-y",
              "@modelcontextprotocol/server-filesystem",
              "/workspace",
            ],
          },
          memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"],
          },
        },
      };

      vi.spyOn(fs, "readFile").mockResolvedValue(
        JSON.stringify(mockConfigWithFilesystem)
      );

      const validation = await validateMcpServersOnly("/fake/config/path");

      // CRITICAL: Filesystem must be SKIPPED from MCP validation
      expect(validation.skippedServers).toContain("filesystem");
      expect(validation.validatedServers).not.toContain("filesystem");

      // If this fails, someone is using the OLD incorrect approach
      // where filesystem was treated as an MCP server
      expect(validation.validatedServers).toEqual(["memory"]);
    });

    test("ARCHITECTURE VALIDATION — github must NOT be validated through MCP configuration", async () => {
      const mockConfigWithGithub = {
        mcpServers: {
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
            env: { GITHUB_TOKEN: "ghp_test123" },
          },
          memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"],
          },
        },
      };

      vi.spyOn(fs, "readFile").mockResolvedValue(
        JSON.stringify(mockConfigWithGithub)
      );

      const validation = await validateMcpServersOnly("/fake/config/path");

      // CRITICAL: GitHub must be SKIPPED from MCP validation
      expect(validation.skippedServers).toContain("github");
      expect(validation.validatedServers).not.toContain("github");

      // Only actual MCP servers should be validated
      expect(validation.validatedServers).toEqual(["memory"]);
    });

    test("ARCHITECTURE VALIDATION — context7 must NOT be validated through MCP configuration", async () => {
      const mockConfigWithContext7 = {
        mcpServers: {
          context7: {
            command: "npx",
            args: ["-y", "@upstash/context7-mcp", "--api-key", "test_key"],
          },
          memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"],
          },
        },
      };

      vi.spyOn(fs, "readFile").mockResolvedValue(
        JSON.stringify(mockConfigWithContext7)
      );

      const validation = await validateMcpServersOnly("/fake/config/path");

      // CRITICAL: Context7 must be SKIPPED from MCP validation
      expect(validation.skippedServers).toContain("context7");
      expect(validation.validatedServers).not.toContain("context7");

      // Only actual MCP servers should be validated
      expect(validation.validatedServers).toEqual(["memory"]);
    });
  });

  describe("REQ-202: Direct Tool Testing Must Be Used for Built-ins", () => {
    test("ARCHITECTURE VALIDATION — built-in features must use direct tool testing, not MCP config checks", async () => {
      const results = await testBuiltInFeatures();

      // CRITICAL: All built-ins must use direct tool testing
      expect(results.filesystem.validatedVia).toBe("direct_tool_test");
      expect(results.context7.validatedVia).toBe("direct_tool_test");
      expect(results.github.validatedVia).toBe("direct_tool_test");

      // CRITICAL: None should check MCP configuration
      expect(results.filesystem.checkedMcpConfig).toBe(false);
      expect(results.context7.checkedMcpConfig).toBe(false);
      expect(results.github.checkedMcpConfig).toBe(false);

      // If these fail, someone is using the OLD approach where
      // built-in features were checked via MCP configuration
    });

    test("ARCHITECTURE VALIDATION — filesystem must use file operations, not config parsing", async () => {
      vi.spyOn(fs, "readdir").mockResolvedValue(["test.txt", "app.js"]);

      const results = await testBuiltInFeatures();

      // CRITICAL: Must use actual file operations
      expect(results.filesystem.method).toBe("file_operation");
      expect(fs.readdir).toHaveBeenCalledWith(process.cwd());

      // If this fails, filesystem is not being tested through direct tool calls
    });
  });

  describe("REQ-204: Only Custom MCP Servers Should Be Validated", () => {
    test("ARCHITECTURE VALIDATION — mixed config with built-ins and custom servers handled correctly", async () => {
      const mixedConfig = {
        mcpServers: {
          // Built-ins that should be SKIPPED
          filesystem: {
            command: "npx",
            args: [
              "-y",
              "@modelcontextprotocol/server-filesystem",
              "/workspace",
            ],
          },
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
          },
          context7: {
            command: "npx",
            args: ["-y", "@upstash/context7-mcp"],
          },
          // Custom servers that SHOULD be validated
          memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"],
          },
          supabase: {
            command: "npx",
            args: ["-y", "@supabase/mcp-server-supabase"],
          },
          customServer: {
            command: "npx",
            args: ["-y", "@my-company/custom-mcp-server"],
          },
        },
      };

      vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mixedConfig));

      const validation = await validateMcpServersOnly("/fake/config/path");

      // CRITICAL: Built-ins must be skipped
      expect(validation.skippedServers).toEqual(
        expect.arrayContaining(["filesystem", "github", "context7"])
      );
      expect(validation.skippedServers).toHaveLength(3);

      // CRITICAL: Only custom servers validated
      expect(validation.validatedServers).toEqual(
        expect.arrayContaining(["memory", "supabase", "customServer"])
      );
      expect(validation.validatedServers).toHaveLength(3);

      // If this fails, the architecture correction is not working
    });

    test("ARCHITECTURE VALIDATION — built-in servers with invalid configs still get skipped", async () => {
      const configWithInvalidBuiltins = {
        mcpServers: {
          filesystem: {
            // Invalid - missing command
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
          },
          github: {
            command: "wrong_command",
            // Invalid configuration
          },
          memory: {
            // Also invalid - missing command
            args: ["-y", "@modelcontextprotocol/server-memory"],
          },
        },
      };

      vi.spyOn(fs, "readFile").mockResolvedValue(
        JSON.stringify(configWithInvalidBuiltins)
      );

      const validation = await validateMcpServersOnly("/fake/config/path");

      // CRITICAL: Built-ins skipped even with invalid configs
      expect(validation.skippedServers).toEqual(
        expect.arrayContaining(["filesystem", "github"])
      );

      // CRITICAL: Only memory should be validated (and show issues)
      expect(validation.validatedServers).toEqual(["memory"]);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].server).toBe("memory");

      // If filesystem/github issues are reported, the old approach is being used
    });
  });

  describe("REQ-206: Migration Guidance for Incorrect Configurations", () => {
    test("ARCHITECTURE VALIDATION — setup verification provides migration guidance for built-ins in MCP config", async () => {
      const incorrectConfig = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: [
              "-y",
              "@modelcontextprotocol/server-filesystem",
              "/workspace",
            ],
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

      vi.spyOn(fs, "readFile").mockResolvedValue(
        JSON.stringify(incorrectConfig)
      );

      const setupResult = await verifyClaudeSetup(
        "/project/path",
        "/fake/config/path"
      );

      // CRITICAL: Must provide migration guidance
      expect(setupResult.migrationGuidance).toBeDefined();
      expect(setupResult.migrationGuidance.filesystem).toContain(
        "Remove from MCP configuration"
      );
      expect(setupResult.migrationGuidance.filesystem).toContain(
        "Settings → Extensions"
      );
      expect(setupResult.migrationGuidance.github).toContain(
        "Remove from MCP configuration"
      );
      expect(setupResult.migrationGuidance.github).toContain(
        "Settings → Connectors"
      );

      // CRITICAL: Architecture explanation must be present
      expect(setupResult.architectureExplanation).toContain(
        "built-in Extensions"
      );
      expect(setupResult.architectureExplanation).toContain(
        "not MCP server configuration"
      );

      // If these fail, the transition guidance is missing
    });
  });

  describe("Prevent Regression: Critical Architecture Checks", () => {
    test("REGRESSION CHECK — ensure BUILT_IN_TOOLS constant is being used correctly", async () => {
      const allBuiltInsConfig = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
          },
          file: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
          },
          fs: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
          },
          context7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
          context: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
          github: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
          },
          git: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-github"],
          },
          memory: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-memory"],
          },
        },
      };

      vi.spyOn(fs, "readFile").mockResolvedValue(
        JSON.stringify(allBuiltInsConfig)
      );

      const validation = await validateMcpServersOnly("/fake/config/path");

      // All variations of built-in tool names should be skipped
      expect(validation.skippedServers).toEqual(
        expect.arrayContaining([
          "filesystem",
          "file",
          "fs",
          "context7",
          "context",
          "github",
          "git",
        ])
      );
      expect(validation.skippedServers).toHaveLength(7);

      // Only memory should be validated
      expect(validation.validatedServers).toEqual(["memory"]);

      // This ensures the BUILT_IN_TOOLS constant is comprehensive
    });

    test("REGRESSION CHECK — comprehensive setup verification maintains correct architecture", async () => {
      const testConfig = {
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem"],
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

      vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(testConfig));
      vi.spyOn(fs, "readdir").mockResolvedValue(["file1.txt"]);

      const result = await verifyClaudeSetup(
        "/project/path",
        "/fake/config/path"
      );

      // Built-in features tested directly
      expect(result.builtInFeatures).toBeDefined();
      expect(result.builtInFeatures.filesystem.validatedVia).toBe(
        "direct_tool_test"
      );
      expect(result.builtInFeatures.github.validatedVia).toBe(
        "direct_tool_test"
      );

      // Only custom MCP servers in result
      expect(result.mcpServers.memory).toBeDefined();
      expect(result.mcpServers.filesystem).toBeUndefined();
      expect(result.mcpServers.github).toBeUndefined();

      // Architecture explanation present
      expect(result.architectureExplanation).toBeDefined();
      expect(result.architectureExplanation).toContain("built-in Extensions");

      // This is the comprehensive check that the architecture is correct
    });
  });
});
