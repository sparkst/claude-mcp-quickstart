import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import {
  createBrainConnectionFile,
} from "./brain-connection.js";
import {
  generateEnhancedPromptContent,
} from "./brain-connection-ux.js";

// Mock the setup-diagnostics module
vi.mock("./setup-diagnostics.js", () => ({
  verifyClaudeSetup: vi.fn().mockResolvedValue({
    success: true,
    analysis: { mcpServers: [], builtInFeatures: {} },
    summary: { filesystemEnabled: true, totalServers: 0 },
    troubleshooting: {}
  }),
}));

// Mock the brain-connection-ux module for specific tests
vi.mock("./brain-connection-ux.js", async () => {
  const actual = await vi.importActual("./brain-connection-ux.js");
  return {
    ...actual,
    generateEnhancedPromptContent: vi.fn().mockReturnValue({
      practicalExamples: [],
      mcpCapabilities: [],
      enabledCapabilities: 0,
      totalCapabilities: 10
    }),
  };
});

describe("P0 Critical Issues - Failing Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("REQ-401: Path Escaping Bug", () => {
    test("REQ-401 — brain-connection.js line 111 uses wrong escaping function causing unreadable paths", async () => {
      const humanReadablePath = "/Users/travis/Documents/my-project";
      const mcpServers = ["memory", "supabase"];

      let capturedContent = "";
      vi.spyOn(fs, "writeFile").mockImplementation((path, content) => {
        capturedContent = content;
        return Promise.resolve();
      });

      await createBrainConnectionFile(humanReadablePath, mcpServers, "Node.js");

      // BUG: Line 111 in brain-connection.js currently uses escapePathSmart(projectPath)
      // It should use escapeMarkdownPath(projectPath) for human readability
      // This test will fail if paths are over-escaped with &#x2F; making them unreadable
      const projectDirectorySection = capturedContent.match(/Project Directory\*\*: `([^`]+)`/);
      expect(projectDirectorySection).toBeTruthy();

      const extractedPath = projectDirectorySection[1];
      // Path should be human-readable, not HTML-encoded
      expect(extractedPath).toBe(humanReadablePath);
      expect(extractedPath).not.toContain("&#x2F;");
    });

    test("REQ-401 — clean paths like '/Users/travis/Documents' remain readable", async () => {
      const cleanPath = "/Users/travis/Documents/claude-mcp-quickstart";
      const mcpServers = ["memory"];

      let capturedContent = "";
      vi.spyOn(fs, "writeFile").mockImplementation((path, content) => {
        capturedContent = content;
        return Promise.resolve();
      });

      await createBrainConnectionFile(cleanPath, mcpServers, "TypeScript");

      // EXPECTED: Clean paths should not be HTML-encoded for readability
      // This test will FAIL because the current escaping is too aggressive
      expect(capturedContent).toMatch(new RegExp(`Primary workspace: [^&]*${cleanPath.replace(/\//g, '\/')}`));
      expect(capturedContent).not.toContain("&#x2F;Users&#x2F;travis&#x2F;Documents");
      expect(capturedContent).not.toContain("&#x2F;claude-mcp-quickstart");
    });

    test("REQ-401 — malicious paths are still properly escaped for security", async () => {
      const maliciousPath = "/safe/path<script>alert('xss')</script>/project";
      const mcpServers = ["memory"];

      let capturedContent = "";
      vi.spyOn(fs, "writeFile").mockImplementation((path, content) => {
        capturedContent = content;
        return Promise.resolve();
      });

      await createBrainConnectionFile(maliciousPath, mcpServers, "Node.js");

      // EXPECTED: Malicious content should be properly escaped
      // This test should PASS - security escaping should work
      expect(capturedContent).not.toContain("<script>alert('xss')</script>");
      expect(capturedContent).toContain("&lt;script&gt;");
    });
  });


  describe("REQ-202: Template Injection Vulnerability", () => {
    test("REQ-202 — MCP server names with script tags are properly escaped in generated content", async () => {
      const projectPath = "/security-test";
      const maliciousServers = [
        "memory",
        '<img src=x onerror=alert(1)>', // Malicious server name
        "supabase"
      ];
      const projectType = "Node.js";

      let capturedContent = "";
      vi.spyOn(fs, "writeFile").mockImplementation((path, content) => {
        capturedContent = content;
        return Promise.resolve();
      });

      await createBrainConnectionFile(projectPath, maliciousServers, projectType);

      // EXPECTED: Script tags should NOT appear unescaped in the output
      // This test will FAIL if formatServerList functions don't properly escape server names
      expect(capturedContent).not.toContain('<img src=x onerror=alert(1)>');

      // The malicious content should be properly escaped
      expect(capturedContent).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });

    test("REQ-202 — formatServerList and formatServerListForJSON prevent script injection", async () => {
      const projectPath = "/format-test";
      const scriptInjectionServers = [
        "memory",
        "</script><script>malicious()</script>",
        "supabase",
        "javascript:alert('xss')"
      ];

      let capturedContent = "";
      vi.spyOn(fs, "writeFile").mockImplementation((path, content) => {
        capturedContent = content;
        return Promise.resolve();
      });

      await createBrainConnectionFile(projectPath, scriptInjectionServers, "Vue.js");

      // EXPECTED: No unescaped script tags should appear anywhere in the content
      // This test will FAIL if the formatServerList functions don't escape properly
      expect(capturedContent).not.toContain('</script><script>malicious()</script>');
      expect(capturedContent).not.toContain("javascript:alert('xss')");

      // Should contain escaped versions in both JSON contexts
      expect(capturedContent).toContain('&lt;&#x2F;script&gt;&lt;script&gt;malicious()&lt;&#x2F;script&gt;');
      expect(capturedContent).toContain("javascript&#x3A;alert('xss')");
    });

    test("REQ-202 — server names in JSON status file are properly escaped", async () => {
      const projectPath = "/json-security-test";
      const dangerousServers = [
        "memory",
        '"malicious":"injection"',
        "supabase"
      ];

      let capturedContent = "";
      vi.spyOn(fs, "writeFile").mockImplementation((path, content) => {
        capturedContent = content;
        return Promise.resolve();
      });

      await createBrainConnectionFile(projectPath, dangerousServers, "Angular");

      // EXPECTED: JSON injection attempts should be escaped
      // This test will FAIL if the JSON context escaping is insufficient
      expect(capturedContent).not.toContain('"malicious":"injection"');

      // Should appear escaped in the JSON status template
      const jsonStatusMatch = capturedContent.match(/"mcp_servers_verified": \[(.*?)\]/);
      expect(jsonStatusMatch).toBeTruthy();
      expect(jsonStatusMatch[1]).toContain('&quot;malicious&quot;&#x3A;&quot;injection&quot;');
    });
  });
});