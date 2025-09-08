import { describe, test, expect, vi } from "vitest";
import { program } from "commander";

// Mock external dependencies and prevent program.parse() execution
vi.mock("chalk", () => ({
  default: {
    cyan: vi.fn((text) => text),
    green: vi.fn((text) => text),
    red: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    gray: vi.fn((text) => text),
    bold: vi.fn(() => ({ green: vi.fn((text) => text) })),
  },
}));

vi.mock("./setup.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: vi.fn(),
  };
});

vi.mock("./dev-mode.js", () => ({
  default: vi.fn(),
}));

vi.mock("fs/promises");
vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Mock process.argv to prevent commander from trying to parse test arguments
Object.defineProperty(process, "argv", {
  value: ["node", "test"],
});

describe("CLI command structure", () => {
  test("generateServerConfig works correctly", async () => {
    const { generateServerConfig } = await import("./setup.js");

    const filesystemConfig = generateServerConfig("filesystem");
    expect(filesystemConfig.command).toBe("npx");
    expect(filesystemConfig.args).toContain(
      "@modelcontextprotocol/server-filesystem",
    );

    const memoryConfig = generateServerConfig("memory");
    expect(memoryConfig.command).toBe("npx");
    expect(memoryConfig.args).toContain("@modelcontextprotocol/server-memory");
  });

  test("generateServerConfig handles API keys", async () => {
    const { generateServerConfig } = await import("./setup.js");

    const githubConfig = generateServerConfig("github", {
      githubToken: "test-token",
    });
    expect(githubConfig.env.GITHUB_TOKEN).toBe("test-token");

    const nullConfig = generateServerConfig("github");
    expect(nullConfig).toBeNull();
  });
});
