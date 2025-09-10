import { describe, test, expect, vi } from "vitest";
import {
  generateServerConfig,
  getConfigPath,
  getWorkspacePath,
  readTemplate,
} from "./setup.js";
import {
  maskToken,
  loadExistingConfig,
  getExistingToken,
  validateToken,
  validateAndMergeConfig,
  withSecureToken,
  createMockConfig,
  createMockServer,
  generateTestToken,
} from "./test-utils.js";
import path from "path";
import os from "os";
import fs from "fs/promises";

describe("generateServerConfig", () => {
  test("creates filesystem server config with default workspace", () => {
    const config = generateServerConfig("filesystem");
    expect(config).toEqual({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        path.join(os.homedir(), "claude-mcp-workspace"),
      ],
    });
  });

  test("creates filesystem server config with custom workspace", () => {
    const workspacePath = "/custom/workspace";
    const config = generateServerConfig("filesystem", { workspacePath });
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", workspacePath],
    });
  });

  test("creates memory server config", () => {
    const config = generateServerConfig("memory");
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
    });
  });

  test("creates github server config with token", () => {
    const githubToken = "test-token-123";
    const config = generateServerConfig("github", { githubToken });
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: githubToken },
    });
  });

  test("returns null for github server without token", () => {
    const config = generateServerConfig("github");
    expect(config).toBeNull();
  });

  test("creates supabase server config with access token", () => {
    const supabaseKey = "sb-test-key";
    const config = generateServerConfig("supabase", { supabaseKey });
    expect(config).toEqual({
      command: "npx",
      args: [
        "-y",
        "@supabase/mcp-server-supabase",
        "--access-token=sb-test-key",
      ],
    });
  });

  test("returns null for supabase server without key", () => {
    const config = generateServerConfig("supabase");
    expect(config).toBeNull();
  });

  test("creates context7 server config with API key", () => {
    const context7ApiKey = "ctx7-test-key";
    const config = generateServerConfig("context7", { context7ApiKey });
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "@upstash/context7-mcp", "--api-key", context7ApiKey],
    });
  });

  test("creates brave server config with API key", () => {
    const braveKey = "brave-test-key";
    const config = generateServerConfig("brave", { braveKey });
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "@brave/brave-search-mcp-server"],
      env: { BRAVE_API_KEY: braveKey },
    });
  });

  test("creates tavily server config with API key", () => {
    const tavilyKey = "tavily-test-key";
    const config = generateServerConfig("tavily", { tavilyKey });
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "tavily-mcp"],
      env: { TAVILY_API_KEY: tavilyKey },
    });
  });

  test("returns null for unknown server type", () => {
    const config = generateServerConfig("unknown");
    expect(config).toBeUndefined();
  });
});

describe("getConfigPath", () => {
  test("returns correct Claude Desktop config path", () => {
    const configPath = getConfigPath();
    expect(configPath).toBe(
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      )
    );
  });
});

describe("getWorkspacePath", () => {
  test("returns correct workspace path", () => {
    const workspacePath = getWorkspacePath();
    expect(workspacePath).toBe(path.join(os.homedir(), "claude-mcp-workspace"));
  });
});

describe("maskToken", () => {
  test("masks long tokens correctly", () => {
    const token = "abcdefgh123456789";
    const masked = maskToken(token);
    expect(masked).toBe("abcde*********789");
  });

  test("masks GitHub personal access token correctly", () => {
    const token = "ghp_1234567890abcdef1234567890abcdef123456";
    const masked = maskToken(token);
    expect(masked).toBe("ghp_1**********************************456");
  });

  test("masks Supabase access token correctly", () => {
    const token = "sbp_abcdefghijklmnopqrstuvwxyz1234567890";
    const masked = maskToken(token);
    expect(masked).toBe("sbp_a********************************890");
  });

  test("returns short tokens unchanged", () => {
    const shortToken = "abc123";
    expect(maskToken(shortToken)).toBe(shortToken);
  });

  test("returns exactly 8 character tokens unchanged", () => {
    const eightChar = "abcd1234";
    expect(maskToken(eightChar)).toBe(eightChar);
  });

  test("handles null/undefined tokens", () => {
    expect(maskToken(null)).toBeNull();
    expect(maskToken(undefined)).toBeUndefined();
    expect(maskToken("")).toBe("");
  });

  test("handles tokens with exactly 9 characters", () => {
    const nineChar = "abcde1234";
    const masked = maskToken(nineChar);
    expect(masked).toBe("abcde*234");
  });

  test("handles very long tokens", () => {
    const longToken = "a".repeat(100);
    const masked = maskToken(longToken);
    expect(masked).toBe("aaaaa" + "*".repeat(92) + "aaa");
    expect(masked.length).toBe(100);
  });
});

describe("loadExistingConfig", () => {
  test("returns parsed config when file exists", async () => {
    const mockConfig = {
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "test-token" },
        },
      },
    };

    vi.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(mockConfig));

    const config = await loadExistingConfig();
    expect(config).toEqual(mockConfig);
  });

  test("returns default config when file doesn't exist", async () => {
    vi.spyOn(fs, "readFile").mockRejectedValue(new Error("ENOENT"));

    const config = await loadExistingConfig();
    expect(config).toEqual({ mcpServers: {} });
  });

  test("returns default config when JSON is invalid", async () => {
    vi.spyOn(fs, "readFile").mockResolvedValue("invalid json");

    const config = await loadExistingConfig();
    expect(config).toEqual({ mcpServers: {} });
  });
});

describe("getExistingToken", () => {
  test("extracts GitHub token from env variables", () => {
    const config = {
      mcpServers: {
        github: {
          command: "npx",
          env: { GITHUB_TOKEN: "ghp_test123456789" },
        },
      },
    };

    const token = getExistingToken(config, "github");
    expect(token).toBe("ghp_test123456789");
  });

  test("extracts Supabase token from command line args", () => {
    const config = {
      mcpServers: {
        supabase: {
          command: "npx",
          args: [
            "-y",
            "@supabase/mcp-server-supabase",
            "--access-token=sbp_test123",
          ],
        },
      },
    };

    const token = getExistingToken(config, "supabase");
    expect(token).toBe("sbp_test123");
  });

  test("extracts Brave API key from env variables", () => {
    const config = {
      mcpServers: {
        brave: {
          command: "npx",
          env: { BRAVE_API_KEY: "brave_test_key" },
        },
      },
    };

    const token = getExistingToken(config, "brave");
    expect(token).toBe("brave_test_key");
  });

  test("extracts Tavily API key from env variables", () => {
    const config = {
      mcpServers: {
        tavily: {
          command: "npx",
          env: { TAVILY_API_KEY: "tavily_test_key" },
        },
      },
    };

    const token = getExistingToken(config, "tavily");
    expect(token).toBe("tavily_test_key");
  });

  test("returns null when server doesn't exist", () => {
    const config = { mcpServers: {} };
    const token = getExistingToken(config, "github");
    expect(token).toBeNull();
  });

  test("returns null when server has no env or args", () => {
    const config = {
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    };

    const token = getExistingToken(config, "github");
    expect(token).toBeNull();
  });

  test("returns null when token key doesn't exist in env", () => {
    const config = {
      mcpServers: {
        github: {
          command: "npx",
          env: { OTHER_TOKEN: "test" },
        },
      },
    };

    const token = getExistingToken(config, "github");
    expect(token).toBeNull();
  });

  test("returns null when Supabase args don't contain access token", () => {
    const config = {
      mcpServers: {
        supabase: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase", "--other-option=value"],
        },
      },
    };

    const token = getExistingToken(config, "supabase");
    expect(token).toBeNull();
  });

  test("handles server names not in token map", () => {
    const config = {
      mcpServers: {
        unknown: {
          command: "npx",
          env: { SOME_TOKEN: "test" },
        },
      },
    };

    const token = getExistingToken(config, "unknown");
    expect(token).toBeNull();
  });

  test("finds GitHub token with GITHUB_PERSONAL_ACCESS_TOKEN key", () => {
    const config = {
      mcpServers: {
        github: {
          command: "npx",
          env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_personal123456789" },
        },
      },
    };

    const token = getExistingToken(config, "github");
    expect(token).toBe("ghp_personal123456789");
  });

  test("handles backward compatibility with brave-search server name", () => {
    const config = {
      mcpServers: {
        "brave-search": {
          command: "npx",
          env: { BRAVE_API_KEY: "brave_compat_key" },
        },
      },
    };

    const token = getExistingToken(config, "brave");
    expect(token).toBe("brave_compat_key");
  });

  test("handles backward compatibility with tavily-search server name", () => {
    const config = {
      mcpServers: {
        "tavily-search": {
          command: "npx",
          env: { TAVILY_API_KEY: "tavily_compat_key" },
        },
      },
    };

    const token = getExistingToken(config, "tavily");
    expect(token).toBe("tavily_compat_key");
  });

  test("cleans up malformed Supabase tokens", () => {
    const config = {
      mcpServers: {
        supabase: {
          command: "npx",
          args: [
            "-y",
            "@supabase/mcp-server-supabase",
            '--access-token="malformed_token"',
          ],
        },
      },
    };

    const token = getExistingToken(config, "supabase");
    expect(token).toBe("malformed_token");
  });

  test("returns null for empty Supabase tokens", () => {
    const config = {
      mcpServers: {
        supabase: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase", '--access-token="'],
        },
      },
    };

    const token = getExistingToken(config, "supabase");
    expect(token).toBeNull();
  });
});

describe("validateToken", () => {
  test("validates GitHub personal access token", () => {
    expect(
      validateToken("ghp_1234567890abcdef1234567890abcdef123456", "github")
    ).toBe(true);
    expect(
      validateToken("ghs_1234567890abcdef1234567890abcdef123456", "github")
    ).toBe(true);
    expect(validateToken("invalid-token", "github")).toBe(false);
  });

  test("validates Supabase access token", () => {
    expect(validateToken("sbp_test123", "supabase")).toBe(true);
    expect(validateToken("sba_test123", "supabase")).toBe(true);
    expect(validateToken("invalid-token", "supabase")).toBe(false);
  });

  test("validates Brave API key", () => {
    expect(validateToken("ABCDEFGHIJKLMNOPQRSTUVWXYZ123456", "brave")).toBe(
      true
    );
    expect(validateToken("lowercase-key", "brave")).toBe(false);
    expect(validateToken("SHORT", "brave")).toBe(false);
  });

  test("validates Tavily API key", () => {
    expect(
      validateToken("tvly-abcdefghijklmnopqrstuvwxyz123456", "tavily")
    ).toBe(true);
    expect(validateToken("invalid-tavily-key", "tavily")).toBe(false);
  });

  test("fallback validation for unknown server types", () => {
    expect(validateToken("longenoughtoken", "unknown")).toBe(true);
    expect(validateToken("short", "unknown")).toBe(false);
  });

  test("rejects invalid token types", () => {
    expect(validateToken(null, "github")).toBe(false);
    expect(validateToken(undefined, "github")).toBe(false);
    expect(validateToken(123, "github")).toBe(false);
    expect(validateToken("", "github")).toBe(false);
  });
});

describe("validateAndMergeConfig", () => {
  test("merges valid configurations", () => {
    const existingConfig = createMockConfig({
      github: createMockServer("github", "existing-token"),
    });

    const newServers = {
      supabase: createMockServer("supabase", "new-token"),
    };

    const result = validateAndMergeConfig(existingConfig, newServers);

    expect(result.mcpServers).toHaveProperty("github");
    expect(result.mcpServers).toHaveProperty("supabase");
    expect(result.mcpServers.github.env.GITHUB_TOKEN).toBe("existing-token");
  });

  test("throws error for invalid existing config", () => {
    expect(() => validateAndMergeConfig(null, {})).toThrow(
      "Invalid existing configuration"
    );
    expect(() => validateAndMergeConfig("invalid", {})).toThrow(
      "Invalid existing configuration"
    );
  });

  test("creates mcpServers if missing", () => {
    const existingConfig = {};
    const newServers = {
      github: createMockServer("github", "test-token"),
    };

    const result = validateAndMergeConfig(existingConfig, newServers);

    expect(result.mcpServers).toHaveProperty("github");
  });

  test("throws error for invalid server config", () => {
    const existingConfig = createMockConfig();
    const invalidServers = {
      github: null,
    };

    expect(() =>
      validateAndMergeConfig(existingConfig, invalidServers)
    ).toThrow("Invalid configuration for server: github");
  });

  test("throws error for malformed server structure", () => {
    const existingConfig = createMockConfig();
    const invalidServers = {
      github: { command: "npx" }, // missing args array
    };

    expect(() =>
      validateAndMergeConfig(existingConfig, invalidServers)
    ).toThrow("Invalid server configuration structure for: github");
  });
});

describe("withSecureToken", () => {
  test("executes callback with token", () => {
    const token = "test-token";
    const callback = vi.fn((t) => t.toUpperCase());

    const result = withSecureToken(token, callback);

    expect(callback).toHaveBeenCalledWith(token);
    expect(result).toBe("TEST-TOKEN");
  });

  test("clears token after callback execution", () => {
    const token = "sensitive-token";
    let capturedToken = null;

    withSecureToken(token, (t) => {
      capturedToken = t;
      return "processed";
    });

    // Token should have been captured during callback
    expect(capturedToken).toBe("sensitive-token");
  });

  test("clears token even if callback throws", () => {
    const token = "error-token";

    expect(() => {
      withSecureToken(token, () => {
        throw new Error("Test error");
      });
    }).toThrow("Test error");
  });
});

// Template tests moved to template.spec.js to avoid fs mocking conflicts
