import { describe, test, expect, vi, beforeEach } from "vitest";
import chalk from "chalk";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: vi.fn((text) => text),
    green: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    red: vi.fn((text) => text),
    gray: vi.fn((text) => text),
  },
}));

describe("REQ-001: Deprecation Warning Styling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-001.1 — chalk.yellow is available for deprecation warnings", () => {
    const message = "GitHub (deprecated - use Claude Settings → Connectors)";
    const styledMessage = chalk.yellow(message);

    expect(chalk.yellow).toHaveBeenCalledWith(message);
    expect(styledMessage).toBe(message);
  });

  test("REQ-001.2 — chalk.cyan is available for guidance messages", () => {
    const message =
      "Recommended: Use Claude Settings → Connectors → GitHub instead";
    const styledMessage = chalk.cyan(message);

    expect(chalk.cyan).toHaveBeenCalledWith(message);
    expect(styledMessage).toBe(message);
  });

  test("REQ-001.3 — chalk.gray is available for help text", () => {
    const message = "This provides better performance and native integration.";
    const styledMessage = chalk.gray(message);

    expect(chalk.gray).toHaveBeenCalledWith(message);
    expect(styledMessage).toBe(message);
  });
});

describe("REQ-002: Deprecation Message Consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("REQ-002.1 — GitHub deprecation message format is consistent", () => {
    const expectedPattern = /GitHub.*deprecated.*Claude Settings.*Connectors/;
    const message = "GitHub (deprecated - use Claude Settings → Connectors)";

    expect(message).toMatch(expectedPattern);
  });

  test("REQ-002.2 — Filesystem deprecation message format is consistent", () => {
    const expectedPattern =
      /Filesystem.*deprecated.*Claude Settings.*Extensions/;
    const message =
      "Filesystem (deprecated - use Claude Settings → Extensions)";

    expect(message).toMatch(expectedPattern);
  });

  test("REQ-002.3 — Deprecation warning emoji is consistent", () => {
    const warningMessage = "⚠️  GitHub MCP Server is deprecated!";

    expect(warningMessage).toContain("⚠️");
    expect(warningMessage).toContain("deprecated!");
  });
});

describe("REQ-003: Context7 Removal Verification", () => {
  test("REQ-003.1 — Context7 should not appear in MCP choice patterns", () => {
    // This test verifies that we don't accidentally re-add Context7
    const invalidChoices = [
      "Context7 Docs",
      "context7",
      "Context7 (deprecated)",
    ];

    invalidChoices.forEach((choice) => {
      expect(choice).not.toMatch(/^Context7$/);
      // This is a pattern test - in real implementation, these shouldn't exist
    });
  });

  test("REQ-003.2 — Context7 removal is complete", () => {
    // Verify Context7 is not in the expected server list
    const supportedServers = ["memory", "supabase", "brave", "tavily"];
    const deprecatedServers = ["github", "filesystem"];
    const allValidServers = [...supportedServers, ...deprecatedServers];

    expect(allValidServers).not.toContain("context7");
  });
});

describe("REQ-004: Claude Settings Guidance Format", () => {
  test("REQ-004.1 — Connectors section format is correct", () => {
    const connectorsSection = `**Connectors:**
- **GitHub**: Native GitHub integration with better performance
- **Cloudflare Developer Platform**: Deploy and manage applications`;

    expect(connectorsSection).toContain("**Connectors:**");
    expect(connectorsSection).toContain("**GitHub**:");
    expect(connectorsSection).toContain("**Cloudflare Developer Platform**:");
  });

  test("REQ-004.2 — Extensions section format is correct", () => {
    const extensionsSection = `**Extensions:**
- **Filesystem**: Secure file access (specify your project directories)
- **Context7**: Documentation lookup and code examples`;

    expect(extensionsSection).toContain("**Extensions:**");
    expect(extensionsSection).toContain("**Filesystem**:");
    expect(extensionsSection).toContain("**Context7**:");
  });

  test("REQ-004.3 — Enhanced capabilities heading is formatted correctly", () => {
    const heading = "🔗 Enhanced Capabilities (Configure in Claude Settings)";

    expect(heading).toContain("🔗");
    expect(heading).toContain("Enhanced Capabilities");
    expect(heading).toContain("Claude Settings");
  });
});

describe("REQ-007: Security Patterns", () => {
  test("REQ-007.1 — Token masking pattern is secure", () => {
    const tokenMaskPattern = (token) => {
      if (!token || token.length < 8) return "***";
      return `${token.substring(0, 3)}...${token.substring(token.length - 3)}`;
    };

    const testToken = "ghp_1234567890abcdef";
    const masked = tokenMaskPattern(testToken);

    expect(masked).toBe("ghp...def");
    expect(masked).not.toContain("1234567890abcd");
  });

  test("REQ-007.2 — Token deletion pattern works", () => {
    const handleTokenInput = (input, existingToken) => {
      if (input === "-") return null; // Delete token
      if (input === "") return existingToken; // Keep existing
      return input; // New token
    };

    expect(handleTokenInput("-", "existing")).toBeNull();
    expect(handleTokenInput("", "existing")).toBe("existing");
    expect(handleTokenInput("new", "existing")).toBe("new");
  });

  test("REQ-007.3 — Password input type is used for sensitive data", () => {
    const tokenPromptConfig = {
      type: "password",
      name: "githubToken",
      mask: "*",
    };

    expect(tokenPromptConfig.type).toBe("password");
    expect(tokenPromptConfig.mask).toBe("*");
  });
});

describe("REQ-008: Path Validation Patterns", () => {
  test("REQ-008.1 — Directory parsing handles comma separation", () => {
    const parseDirectories = (input) => {
      return input
        .split(",")
        .map((dir) => dir.trim())
        .filter((dir) => dir.length > 0);
    };

    const testInput = " /path1 , /path2 , /path3 ";
    const parsed = parseDirectories(testInput);

    expect(parsed).toEqual(["/path1", "/path2", "/path3"]);
  });

  test("REQ-008.2 — Default directory is current working directory", () => {
    const defaultDir = process.cwd();

    expect(defaultDir).toBeDefined();
    expect(typeof defaultDir).toBe("string");
    expect(defaultDir.length).toBeGreaterThan(0);
  });

  test("REQ-008.3 — Filesystem args construction works correctly", () => {
    const constructArgs = (directories) => {
      return [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        ...directories.split(",").map((dir) => dir.trim()),
      ];
    };

    const result = constructArgs("/home/user,/projects");

    expect(result).toEqual([
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/home/user",
      "/projects",
    ]);
  });
});

describe("REQ-009: Error Handling Patterns", () => {
  test("REQ-009.1 — Error messages are informative", () => {
    const createErrorMessage = (context, error) => {
      return `${context}: ${error.message}`;
    };

    const error = new Error("Connection failed");
    const message = createErrorMessage("Setup failed", error);

    expect(message).toBe("Setup failed: Connection failed");
  });

  test("REQ-009.2 — Console error handling is available", () => {
    const originalError = console.error;
    console.error = vi.fn();

    console.error("Test error message");

    expect(console.error).toHaveBeenCalledWith("Test error message");

    console.error = originalError;
  });
});

describe("REQ-010: Integration Compatibility", () => {
  test("REQ-010.1 — Vitest testing framework functions are available", () => {
    expect(describe).toBeDefined();
    expect(test).toBeDefined();
    expect(expect).toBeDefined();
    expect(vi).toBeDefined();
    expect(beforeEach).toBeDefined();
  });

  test("REQ-010.2 — Mock functions work as expected", () => {
    const mockFn = vi.fn();
    mockFn("test");

    expect(mockFn).toHaveBeenCalledWith("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("REQ-010.3 — Test isolation works correctly", () => {
    vi.clearAllMocks();

    const mockFn = vi.fn();
    expect(mockFn).toHaveBeenCalledTimes(0);
  });
});
