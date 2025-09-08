import { describe, test, expect } from "vitest";
import path from "path";
import os from "os";
import { getConfigPath, getWorkspacePath } from "./setup.js";

describe("platform compatibility", () => {
  test("uses correct macOS config path", () => {
    const configPath = getConfigPath();
    const expectedPath = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );

    expect(configPath).toBe(expectedPath);
    expect(configPath).toContain("Library/Application Support/Claude");
    expect(configPath.endsWith("claude_desktop_config.json")).toBe(true);
  });

  test("workspace path uses home directory", () => {
    const workspacePath = getWorkspacePath();
    const expectedPath = path.join(os.homedir(), "claude-mcp-workspace");

    expect(workspacePath).toBe(expectedPath);
    expect(workspacePath).toContain(os.homedir());
    expect(workspacePath.endsWith("claude-mcp-workspace")).toBe(true);
  });

  test("handles path separators correctly", () => {
    const configPath = getConfigPath();
    const workspacePath = getWorkspacePath();

    // Should use platform-appropriate separators
    expect(configPath).toContain(path.sep);
    expect(workspacePath).toContain(path.sep);

    // Should not contain mixed separators
    expect(configPath).not.toMatch(/[/\\]{2,}/);
    expect(workspacePath).not.toMatch(/[/\\]{2,}/);
  });

  test("resolves to absolute paths", () => {
    const configPath = getConfigPath();
    const workspacePath = getWorkspacePath();

    expect(path.isAbsolute(configPath)).toBe(true);
    expect(path.isAbsolute(workspacePath)).toBe(true);
  });
});
