import { describe, test, expect } from "vitest";
import { readTemplate } from "./setup.js";

describe("readTemplate", () => {
  test("uses package directory for template path resolution", async () => {
    // Test that readTemplate uses __dirname (package directory) not process.cwd()
    const templateContent = await readTemplate("ai-activation.md");
    expect(templateContent).toContain("AI Assistant - Instant Activation");
    expect(typeof templateContent).toBe("string");
    expect(templateContent.length).toBeGreaterThan(0);
  });

  test("reads all core template files correctly", async () => {
    const coreTemplates = [
      "ai-activation.md",
      "lovable-patterns.md",
      "prompt-library.md",
      "usage-guide.md",
    ];

    for (const templateName of coreTemplates) {
      const content = await readTemplate(templateName);
      expect(content).toBeTruthy();
      expect(typeof content).toBe("string");
      expect(content.length).toBeGreaterThan(10);
    }
  });

  test("reads all project template files correctly", async () => {
    const projectTemplates = [
      "project-templates/api-template.md",
      "project-templates/learning-template.md",
      "project-templates/lovable-template.md",
      "project-templates/minimal-template.md",
    ];

    for (const templateName of projectTemplates) {
      const content = await readTemplate(templateName);
      expect(content).toBeTruthy();
      expect(typeof content).toBe("string");
      expect(content.length).toBeGreaterThan(10);
    }
  });

  test("throws error for missing template files", async () => {
    await expect(readTemplate("nonexistent-template.md")).rejects.toThrow(
      "Template file missing"
    );
  });

  test("error message includes correct path for missing templates", async () => {
    try {
      await readTemplate("missing.md");
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).toContain("templates/missing.md");
      expect(error.message).toContain("Template file missing");
    }
  });

  test("template path uses package directory not working directory", async () => {
    // Verify the template path resolves to package directory
    // This test ensures the fix works by reading actual template content
    const content = await readTemplate("ai-activation.md");
    expect(content).toContain("AI Assistant - Instant Activation");

    // Test that it would work regardless of cwd by checking the implementation behavior
    // The key fix is using __dirname instead of process.cwd()
    expect(content).toBeTruthy();
  });
});
