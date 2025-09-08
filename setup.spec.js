import { describe, test, expect } from "vitest";
import {
  generateServerConfig,
  getConfigPath,
  getWorkspacePath,
} from "./setup.js";
import path from "path";
import os from "os";

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

  test("creates supabase server config with API key", () => {
    const supabaseKey = "sb-test-key";
    const config = generateServerConfig("supabase", { supabaseKey });
    expect(config).toEqual({
      command: "npx",
      args: ["-y", "@joshuarileydev/supabase-mcp-server"],
      env: { SUPABASE_API_KEY: supabaseKey },
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
        "claude_desktop_config.json",
      ),
    );
  });
});

describe("getWorkspacePath", () => {
  test("returns correct workspace path", () => {
    const workspacePath = getWorkspacePath();
    expect(workspacePath).toBe(path.join(os.homedir(), "claude-mcp-workspace"));
  });
});
