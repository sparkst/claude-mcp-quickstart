import { describe, test, expect } from "vitest";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * REQ-311: Package Distribution Integrity Tests
 * Critical tests to prevent ERR_MODULE_NOT_FOUND errors
 */
describe("REQ-311: Package Distribution Integrity", () => {
  test("REQ-311 — package.json files array includes all required modules", async () => {
    const packageJsonPath = path.join(__dirname, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

    const requiredModules = [
      "config-analyzer.js",
      "setup-diagnostics.js",
      "brain-connection-ux.js",
      "brain-connection.js",
      "setup.js",
      "index.js",
    ];

    const filesArray = packageJson.files || [];

    for (const module of requiredModules) {
      expect(filesArray).toContain(module);

      // Verify file actually exists
      const filePath = path.join(__dirname, module);
      await expect(fs.access(filePath)).resolves.toBeUndefined();
    }
  });

  test("REQ-311 — npm pack would include all required modules", async () => {
    // Verify npm pack would include required files by checking package.json files array
    const packageJsonPath = path.join(__dirname, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

    const requiredModules = [
      "config-analyzer.js",
      "setup-diagnostics.js",
      "brain-connection-ux.js",
      "brain-connection.js",
    ];

    const filesArray = packageJson.files || [];

    // Check that all required modules are in the files array AND exist
    for (const module of requiredModules) {
      expect(filesArray).toContain(module);

      const filePath = path.join(__dirname, module);
      await expect(fs.access(filePath)).resolves.toBeUndefined();
    }

    // Verify npm pack command works without errors
    const packResult = await new Promise((resolve, reject) => {
      const process = spawn("npm", ["pack", "--dry-run"], {
        cwd: __dirname,
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, success: true });
        } else {
          reject(new Error(`npm pack failed with code ${code}: ${stderr}`));
        }
      });
    });

    expect(packResult.success).toBe(true);
    expect(packResult.stdout).toContain("claude-mcp-quickstart-2.3.2.tgz");
  });

  test("REQ-311 — repository excludes build artifacts", async () => {
    const files = await fs.readdir(__dirname);
    const tgzFiles = files.filter((file) => file.endsWith(".tgz"));

    expect(tgzFiles).toEqual([]);
  });

  test("REQ-311 — package.json has no circular dependencies", async () => {
    const packageJsonPath = path.join(__dirname, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

    const dependencies = Object.keys(packageJson.dependencies || {});
    const packageName = packageJson.name;

    expect(dependencies).not.toContain(packageName);
  });
});
