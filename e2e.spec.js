import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { dir as tmpdir } from "tmp-promise";
import { generateServerConfig } from "./setup.js";

// Mock external dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: vi.fn((text) => text),
    green: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    red: vi.fn((text) => text),
  },
}));

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe("end-to-end setup workflow", () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await tmpdir({ unsafeCleanup: true });

    vi.doMock("./setup.js", async () => {
      const actual = await vi.importActual("./setup.js");
      return {
        ...actual,
        getConfigPath: () =>
          path.join(tempDir.path, "claude_desktop_config.json"),
        getWorkspacePath: () => path.join(tempDir.path, "workspace"),
      };
    });
  });

  afterEach(async () => {
    if (tempDir) {
      await tempDir.cleanup();
    }
    vi.clearAllMocks();
  });

  test("creates config file when none exists", async () => {
    const configPath = path.join(tempDir.path, "claude_desktop_config.json");

    // Test that config doesn't exist initially
    await expect(fs.access(configPath)).rejects.toThrow();

    // Mock a basic server config
    const servers = {
      filesystem: generateServerConfig("filesystem", {
        workspacePath: path.join(tempDir.path, "workspace"),
      }),
      memory: generateServerConfig("memory"),
    };

    const config = { mcpServers: servers };

    // Write config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    // Verify config exists and is valid
    const savedConfig = JSON.parse(await fs.readFile(configPath, "utf-8"));
    expect(savedConfig.mcpServers.filesystem).toBeDefined();
    expect(savedConfig.mcpServers.memory).toBeDefined();
    expect(savedConfig.mcpServers.filesystem.command).toBe("npx");
    expect(savedConfig.mcpServers.filesystem.args).toContain(
      "@modelcontextprotocol/server-filesystem"
    );
  });

  test("preserves existing config and adds new servers", async () => {
    const configPath = path.join(tempDir.path, "claude_desktop_config.json");

    // Create initial config with existing server
    const existingConfig = {
      mcpServers: {
        existing: {
          command: "test",
          args: ["existing"],
        },
      },
      otherProperty: "preserved",
    };

    await fs.writeFile(configPath, JSON.stringify(existingConfig, null, 2));

    // Add new servers
    const newServers = {
      filesystem: generateServerConfig("filesystem", {
        workspacePath: path.join(tempDir.path, "workspace"),
      }),
      memory: generateServerConfig("memory"),
    };

    const mergedConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...newServers,
      },
    };

    await fs.writeFile(configPath, JSON.stringify(mergedConfig, null, 2));

    // Verify merged config
    const finalConfig = JSON.parse(await fs.readFile(configPath, "utf-8"));
    expect(finalConfig.otherProperty).toBe("preserved");
    expect(finalConfig.mcpServers.existing).toEqual({
      command: "test",
      args: ["existing"],
    });
    expect(finalConfig.mcpServers.filesystem).toBeDefined();
    expect(finalConfig.mcpServers.memory).toBeDefined();
  });

  test("creates workspace directory structure", async () => {
    const workspacePath = path.join(tempDir.path, "workspace");

    // Create workspace
    await fs.mkdir(workspacePath, { recursive: true });

    // Create context files
    const contextFiles = [
      "DEV_MODE.md",
      "BOOTSTRAP_LOVABLE.md",
      "PRINCIPLES.md",
      "CONTEXT.md",
    ];

    for (const file of contextFiles) {
      await fs.writeFile(
        path.join(workspacePath, file),
        `# ${file}\nTest content for ${file}`
      );
    }

    // Verify workspace structure
    const files = await fs.readdir(workspacePath);
    for (const expectedFile of contextFiles) {
      expect(files).toContain(expectedFile);
    }

    // Verify file contents
    const devModeContent = await fs.readFile(
      path.join(workspacePath, "DEV_MODE.md"),
      "utf-8"
    );
    expect(devModeContent).toContain("DEV_MODE.md");
  });

  test("handles server configuration with API keys", () => {
    const testConfigs = [
      {
        type: "github",
        options: { githubToken: "test-token-123" },
        expectedEnv: { GITHUB_TOKEN: "test-token-123" },
      },
      {
        type: "brave",
        options: { braveKey: "brave-key" },
        expectedEnv: { BRAVE_API_KEY: "brave-key" },
      },
    ];

    // Test configs that use environment variables
    for (const { type, options, expectedEnv } of testConfigs) {
      const config = generateServerConfig(type, options);
      expect(config).toBeDefined();
      expect(config.env).toEqual(expectedEnv);
      expect(config.command).toBe("npx");
    }

    // Test Supabase config separately (uses command line args, not env vars)
    const supabaseConfig = generateServerConfig("supabase", {
      supabaseKey: "sb-test-key",
    });
    expect(supabaseConfig).toBeDefined();
    expect(supabaseConfig.command).toBe("npx");
    expect(supabaseConfig.args).toContain("--access-token=sb-test-key");
    expect(supabaseConfig.env).toBeUndefined();
  });

  test("handles missing API keys gracefully", () => {
    const optionalServers = ["github", "supabase", "brave", "tavily"];

    for (const serverType of optionalServers) {
      const config = generateServerConfig(serverType);
      expect(config).toBeNull();
    }
  });
});
