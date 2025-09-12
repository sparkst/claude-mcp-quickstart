import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";

// These modules will need to be implemented
import {
  validatePackageFiles,
  checkPackageIntegrity,
  runPackageWorkflowTest,
  cleanBuildArtifacts,
  validateRepositoryState,
} from "./package-validation.js";

describe("REQ-311: Package Distribution Quality", () => {
  const testPackageJson = {
    name: "test-package",
    version: "1.0.0",
    files: [
      "index.js",
      "setup.js",
      "brain-connection-ux.js",
      "templates/",
      "CHANGELOG.md",
      "nonexistent-file.js", // This should cause validation to fail
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("REQ-311 — validates all files in package.json files array exist", async () => {
    const result = await validatePackageFiles(testPackageJson);

    expect(result.valid).toBe(false);
    expect(result.missingFiles).toContain("nonexistent-file.js");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("nonexistent-file.js");
  });

  test("REQ-311 — checks package integrity before distribution", async () => {
    const integrityResult = await checkPackageIntegrity();

    expect(integrityResult).toHaveProperty("filesValid");
    expect(integrityResult).toHaveProperty("testsPass");
    expect(integrityResult).toHaveProperty("artifactsClean");
    expect(integrityResult.ready).toBe(false); // Should fail until all issues fixed
  });

  test("REQ-311 — integration test for npm pack and install workflow", async () => {
    // This test should fail until implementation exists
    const workflowResult = await runPackageWorkflowTest();

    expect(workflowResult.packSuccess).toBe(true);
    expect(workflowResult.installSuccess).toBe(true);
    expect(workflowResult.fileCount).toBeGreaterThan(0);
    expect(workflowResult.tarballPath).toMatch(/\.tgz$/);
  });

  test("REQ-311 — verifies published package contains all necessary files", async () => {
    const packageDir = process.cwd();
    const result = await validatePackageFiles({
      ...testPackageJson,
      files: ["index.js", "setup.js", "templates/", "CHANGELOG.md"],
    });

    expect(result.valid).toBe(true);
    expect(result.missingFiles).toHaveLength(0);
    expect(result.totalFiles).toBeGreaterThan(3);
  });

  test("REQ-311 — prevents distribution when tests are not green", async () => {
    // Mock failing tests
    const mockTestResult = { success: false, failureCount: 30 };

    const distributionCheck = await checkPackageIntegrity();

    expect(distributionCheck.testsPass).toBe(false);
    expect(distributionCheck.ready).toBe(false);
    expect(distributionCheck.blockingIssues).toContain("failing tests");
  });
});

describe("REQ-313: Repository Maintenance", () => {
  const mockArtifactPaths = [
    "/test/claude-mcp-quickstart-2.3.0.tgz",
    "/test/claude-mcp-quickstart-2.2.9.tgz",
    "/test/claude-mcp-quickstart-2.2.8.tgz",
  ];

  test("REQ-313 — removes all committed .tgz build artifacts", async () => {
    const cleanupResult = await cleanBuildArtifacts();

    expect(cleanupResult.artifactsRemoved).toBeGreaterThan(0);
    expect(cleanupResult.cleanupSuccess).toBe(true);
    expect(cleanupResult.removedFiles).toEqual(
      expect.arrayContaining([expect.stringMatching(/\.tgz$/)])
    );
  });

  test("REQ-313 — adds .tgz files to .gitignore to prevent future commits", async () => {
    const result = await validateRepositoryState();

    expect(result.gitignoreUpdated).toBe(true);
    expect(result.gitignoreContains).toContain("*.tgz");
    expect(result.preventsFutureCommits).toBe(true);
  });

  test("REQ-313 — verifies clean working tree after cleanup", async () => {
    const repoState = await validateRepositoryState();

    expect(repoState.workingTreeClean).toBe(true);
    expect(repoState.noUncommittedFiles).toBe(true);
    expect(repoState.noArtifactsPresent).toBe(true);
  });

  test("REQ-313 — ensures no important files are accidentally removed", async () => {
    const cleanupResult = await cleanBuildArtifacts();

    expect(cleanupResult.importantFilesPreserved).toBe(true);
    expect(cleanupResult.onlyArtifactsRemoved).toBe(true);

    // Verify critical files still exist
    const criticalFiles = ["package.json", "index.js", "setup.js"];
    for (const file of criticalFiles) {
      expect(cleanupResult.preservedFiles).toContain(file);
    }
  });
});

describe("REQ-314: Package Files Validation", () => {
  const mockPackageJson = {
    name: "claude-mcp-quickstart",
    version: "2.3.0",
    files: [
      "index.js",
      "setup.js",
      "dev-mode.js",
      "brain-connection.js",
      "brain-connection-ux.js",
      "templates/",
      "CHANGELOG.md",
      "missing-file.js", // This should fail validation
    ],
  };

  test("REQ-314 — validates all files in package.json files array exist", async () => {
    const validation = await validatePackageFiles(mockPackageJson);

    expect(validation.hasErrors).toBe(true);
    expect(validation.missingFiles).toContain("missing-file.js");
    expect(validation.validFiles).not.toContain("missing-file.js");
    expect(validation.totalChecked).toBe(mockPackageJson.files.length);
  });

  test("REQ-314 — checks for missing critical files before packaging", async () => {
    const criticalCheck = await checkPackageIntegrity();

    expect(criticalCheck.criticalFilesMissing).toBe(false);
    expect(criticalCheck.hasRequiredEntryPoints).toBe(true);
    expect(criticalCheck.hasRequiredDocs).toBe(true);
  });

  test("REQ-314 — warns about common packaging mistakes", async () => {
    const packageWithMistakes = {
      ...mockPackageJson,
      files: [
        "*.js", // Glob patterns should be warned about
        "node_modules/", // Should never be included
        ".git/", // Should never be included
        "tests/", // Test files shouldn't be in production package
      ],
    };

    const validation = await validatePackageFiles(packageWithMistakes);

    expect(validation.warnings).toHaveLength.greaterThan(0);
    expect(validation.warnings.some((w) => w.includes("node_modules"))).toBe(
      true
    );
    expect(validation.warnings.some((w) => w.includes("test"))).toBe(true);
  });

  test("REQ-314 — integrates validation into test suite", async () => {
    // This test verifies that validation runs as part of the test suite
    const validationResults = await validatePackageFiles({
      name: "test",
      files: ["index.js", "package.json"], // Valid files
    });

    expect(validationResults.runInTestSuite).toBe(true);
    expect(validationResults.validationComplete).toBe(true);
    expect(validationResults.integratedWithTests).toBe(true);
  });

  test("REQ-314 — prevents broken packages from being distributed", async () => {
    const brokenPackage = {
      name: "broken-package",
      files: ["nonexistent1.js", "nonexistent2.js", "missing-template.json"],
    };

    const validation = await validatePackageFiles(brokenPackage);
    const integrity = await checkPackageIntegrity();

    expect(validation.valid).toBe(false);
    expect(integrity.ready).toBe(false);
    expect(integrity.blockingIssues).toContain("missing package files");
  });
});
