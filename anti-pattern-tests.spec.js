import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";

// Import the corrected architecture functions
import {
  testBuiltInFeatures,
  validateMcpServersOnly,
} from "./setup-diagnostics.js";

/**
 * These tests would FAIL if someone implements the OLD incorrect architecture.
 * They test that the WRONG approaches are NOT being used.
 *
 * If any of these tests start failing, it means someone has regressed
 * to the old incorrect Claude Desktop architecture understanding.
 */
describe("Anti-Pattern Tests: Ensure OLD Incorrect Architecture is NOT Implemented", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("FAIL IF: filesystem is validated as MCP server (OLD incorrect approach)", async () => {
    const configWithFilesystem = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithFilesystem)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // This test will FAIL if someone implements the old approach
    // where filesystem was treated as an MCP server to validate
    expect(validation.validatedServers).not.toContain("filesystem");
    expect(validation.skippedServers).toContain("filesystem");

    // OLD approach would have: validation.validatedServers = ["filesystem"]
    // NEW correct approach has: validation.skippedServers = ["filesystem"]
  });

  test("FAIL IF: github is validated as MCP server (OLD incorrect approach)", async () => {
    const configWithGithub = {
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "test_token" },
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithGithub)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // This test will FAIL if someone implements the old approach
    expect(validation.validatedServers).not.toContain("github");
    expect(validation.skippedServers).toContain("github");
  });

  test("FAIL IF: context7 is validated as MCP server (OLD incorrect approach)", async () => {
    const configWithContext7 = {
      mcpServers: {
        context7: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp", "--api-key", "test_key"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithContext7)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // This test will FAIL if someone implements the old approach
    expect(validation.validatedServers).not.toContain("context7");
    expect(validation.skippedServers).toContain("context7");
  });

  test("FAIL IF: built-in features check MCP configuration (OLD incorrect approach)", async () => {
    const results = await testBuiltInFeatures();

    // These assertions will FAIL if someone implements the old approach
    // where built-in features were validated through MCP configuration

    // All built-in features must use direct tool testing
    expect(results.filesystem.checkedMcpConfig).toBe(false);
    expect(results.context7.checkedMcpConfig).toBe(false);
    expect(results.github.checkedMcpConfig).toBe(false);

    // All must use direct validation approach
    expect(results.filesystem.validatedVia).toBe("direct_tool_test");
    expect(results.context7.validatedVia).toBe("direct_tool_test");
    expect(results.github.validatedVia).toBe("direct_tool_test");

    // OLD approach would have:
    // - checkedMcpConfig: true
    // - validatedVia: "mcp_config_check"
  });

  test("FAIL IF: filesystem uses MCP config validation instead of file operations", async () => {
    vi.spyOn(fs, "readdir").mockResolvedValue(["test.txt"]);

    const results = await testBuiltInFeatures();

    // This will FAIL if filesystem doesn't use actual file operations
    expect(results.filesystem.method).toBe("file_operation");
    expect(fs.readdir).toHaveBeenCalled();

    // OLD approach would not call fs.readdir and would use:
    // method: "mcp_config_check"
  });

  test("FAIL IF: built-in MCP servers generate validation issues (OLD approach)", async () => {
    const configWithInvalidBuiltIns = {
      mcpServers: {
        filesystem: {
          // Invalid config - missing command
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
        github: {
          command: "invalid_command",
          args: ["broken"],
        },
        context7: {
          // Completely malformed
          invalidProperty: "test",
        },
        memory: {
          // Also invalid - missing command
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithInvalidBuiltIns)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Built-in servers should be skipped, so NO issues should be reported for them
    const builtInIssues = validation.issues.filter((issue) =>
      ["filesystem", "github", "context7"].includes(issue.server)
    );
    expect(builtInIssues).toHaveLength(0);

    // Only custom MCP server (memory) issues should be reported
    const mcpIssues = validation.issues.filter(
      (issue) => issue.server === "memory"
    );
    expect(mcpIssues).toHaveLength(1);

    // OLD approach would report issues for filesystem, github, context7
    // NEW approach skips built-ins entirely
  });

  test("FAIL IF: no distinction between built-in tools and MCP servers", async () => {
    const mixedConfig = {
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
        supabase: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mixedConfig));

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Must distinguish between built-ins and custom servers
    expect(validation.skippedServers.length).toBeGreaterThan(0);
    expect(validation.validatedServers.length).toBeGreaterThan(0);

    // Built-ins must be skipped
    expect(validation.skippedServers).toEqual(
      expect.arrayContaining(["filesystem", "github"])
    );

    // Custom servers must be validated
    expect(validation.validatedServers).toEqual(
      expect.arrayContaining(["memory", "supabase"])
    );

    // OLD approach would validate everything as MCP servers:
    // validatedServers = ["filesystem", "memory", "github", "supabase"]
    // skippedServers = []
  });

  test("FAIL IF: case sensitivity causes built-ins to be validated (regression check)", async () => {
    const configWithCaseVariations = {
      mcpServers: {
        FileSystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
        GITHUB: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
        Context7: { command: "npx", args: ["-y", "@upstash/context7-mcp"] },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithCaseVariations)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Case variations of built-in tools must also be skipped
    expect(validation.skippedServers).toEqual(
      expect.arrayContaining(["FileSystem", "GITHUB", "Context7"])
    );
    expect(validation.validatedServers).toEqual(["memory"]);

    // Broken case-sensitive implementation would validate built-ins
  });

  test("FAIL IF: substring matching for built-ins is too broad or too narrow", async () => {
    const configWithPartialMatches = {
      mcpServers: {
        "filesystem-extra": {
          command: "npx",
          args: ["-y", "@custom/filesystem-server"],
        },
        "github-custom": {
          command: "npx",
          args: ["-y", "@custom/github-server"],
        },
        "my-context7-server": {
          command: "npx",
          args: ["-y", "@custom/context-server"],
        },
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(configWithPartialMatches)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // Servers containing built-in tool names should be skipped
    expect(validation.skippedServers).toEqual(
      expect.arrayContaining([
        "filesystem-extra",
        "github-custom",
        "my-context7-server",
      ])
    );
    expect(validation.validatedServers).toEqual(["memory"]);

    // This ensures the substring matching logic is working correctly
  });
});

describe("Critical Failure Scenarios: These MUST Pass or Architecture is Broken", () => {
  test("CRITICAL: All known built-in tool variations must be skipped from MCP validation", async () => {
    const allKnownBuiltIns = {
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
        // This should be the ONLY one validated
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(
      JSON.stringify(allKnownBuiltIns)
    );

    const validation = await validateMcpServersOnly("/fake/config/path");

    // ALL built-in variations must be skipped
    expect(validation.skippedServers).toHaveLength(7);
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

    // ONLY memory should be validated
    expect(validation.validatedServers).toEqual(["memory"]);

    // If this fails, the BUILT_IN_TOOLS constant is incomplete
    // or the matching logic is broken
  });

  test("CRITICAL: Built-in features must NEVER report MCP validation results", async () => {
    const results = await testBuiltInFeatures();

    // These properties must NEVER indicate MCP config checking
    Object.entries(results).forEach(([featureName, result]) => {
      expect(result.checkedMcpConfig).toBe(false);
      expect(result.validatedVia).toBe("direct_tool_test");
      expect(result.validatedVia).not.toBe("mcp_config_check");
      expect(result.validatedVia).not.toBe("configuration_file");

      // If any of these fail, built-in features are using MCP validation
    });

    // If this test fails, the testBuiltInFeatures function is broken
  });
});
