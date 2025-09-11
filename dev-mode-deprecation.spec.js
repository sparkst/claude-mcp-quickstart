import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import chalk from "chalk";
import generateClaudeIntegration from "./dev-mode.js";

// Mock dependencies
vi.mock("fs/promises");
vi.mock("chalk", () => ({
  default: {
    cyan: vi.fn((text) => text),
    green: vi.fn((text) => text),
    gray: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    red: vi.fn((text) => text),
  },
}));

describe("REQ-005: Dev-Mode Deprecation Descriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("REQ-005.1 — includes GitHub deprecation notice in server descriptions", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {},
        github: {},
      },
    };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: { react: "^18.0.0" } });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const contextCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-context"));
    const contextContent = contextCall[1];

    expect(contextContent).toContain("github");
    expect(contextContent).toContain("deprecated");
    expect(contextContent).toContain("Claude Settings → Connectors → GitHub");
  });

  test("REQ-005.2 — includes filesystem deprecation notice in server descriptions", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {},
        filesystem: {},
      },
    };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const contextCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-context"));
    const contextContent = contextCall[1];

    expect(contextContent).toContain("filesystem");
    expect(contextContent).toContain("deprecated");
    expect(contextContent).toContain(
      "Claude Settings → Extensions → Filesystem"
    );
  });

  test("REQ-005.3 — includes Context7 deprecation notice in server descriptions", async () => {
    const mockConfig = {
      mcpServers: {
        memory: {},
        context7: {},
      },
    };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const contextCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-context"));
    const contextContent = contextCall[1];

    expect(contextContent).toContain("context7");
    expect(contextContent).toContain("deprecated");
    expect(contextContent).toContain("Claude Settings → Extensions");
  });
});

describe("REQ-004: Claude Settings Guidance Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("REQ-004.1 — includes Connectors section in integration prompt", async () => {
    const mockConfig = { mcpServers: { memory: {} } };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const promptCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-integration.md"));
    const promptContent = promptCall[1];

    expect(promptContent).toContain("🔗 Enhanced Capabilities");
    expect(promptContent).toContain("**Connectors:**");
    expect(promptContent).toContain("**GitHub**: Native GitHub integration");
    expect(promptContent).toContain(
      "**Cloudflare Developer Platform**: Deploy and manage"
    );
  });

  test("REQ-004.2 — includes Extensions section in integration prompt", async () => {
    const mockConfig = { mcpServers: { memory: {} } };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const promptCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-integration.md"));
    const promptContent = promptCall[1];

    expect(promptContent).toContain("**Extensions:**");
    expect(promptContent).toContain("**Filesystem**: Secure file access");
    expect(promptContent).toContain("**Context7**: Documentation lookup");
  });

  test("REQ-004.3 — formats Claude Settings guidance consistently", async () => {
    const mockConfig = { mcpServers: { memory: {} } };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const promptCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-integration.md"));
    const promptContent = promptCall[1];

    // Verify consistent markdown formatting
    expect(promptContent).toContain("## 🔗 Enhanced Capabilities");
    expect(promptContent).toMatch(/\*\*Connectors:\*\*\n- \*\*GitHub\*\*/);
    expect(promptContent).toMatch(/\*\*Extensions:\*\*\n- \*\*Filesystem\*\*/);
  });

  test("REQ-004.4 — maintains guidance when no MCP servers configured", async () => {
    const mockConfig = { mcpServers: {} };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    const promptCall = vi
      .mocked(fs.writeFile)
      .mock.calls.find((call) => call[0].includes(".claude-integration.md"));
    const promptContent = promptCall[1];

    // Should still show Claude Settings guidance even with no MCP servers
    expect(promptContent).toContain("🔗 Enhanced Capabilities");
    expect(promptContent).toContain("**Connectors:**");
    expect(promptContent).toContain("**Extensions:**");
    expect(promptContent).toContain("⚠️  **No MCP servers detected**");
  });

  test("REQ-004.5 — displays guidance correctly in console output", async () => {
    const mockConfig = { mcpServers: { memory: {} } };

    vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
      if (filePath.includes("package.json")) {
        return JSON.stringify({ dependencies: {} });
      }
      if (filePath.includes("claude_desktop_config.json")) {
        return JSON.stringify(mockConfig);
      }
      throw new Error("File not found");
    });

    vi.mocked(fs.readdir).mockResolvedValue([]);
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");

    await generateClaudeIntegration();

    // Verify console output includes guidance
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("🔗 Enhanced Capabilities")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("**Connectors:**")
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("**Extensions:**")
    );
  });
});
