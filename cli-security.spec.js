import { describe, test, expect, vi, beforeEach } from "vitest";
import chalk from "chalk";

// Mock chalk to prevent color codes in test output
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

// Mock external dependencies
vi.mock("./setup.js", () => ({ default: vi.fn() }));
vi.mock("./dev-mode.js", () => ({ default: vi.fn() }));
vi.mock("fs/promises");

describe("CLI Security Tests", () => {
  let consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console methods
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("REQ-SEC-001: Command Allowlisting Security", () => {
    test("REQ-SEC-001 — only predefined commands are processed by CLI", async () => {
      // Set test environment
      process.env.NODE_ENV = "test";

      // Import after setting environment
      const { program } = await import("./index.js");

      // Valid commands should be in allowlist
      const validCommands = ["setup", "dev-mode", "verify", "quick-start"];

      for (const command of validCommands) {
        // These should not throw as they are in allowlist
        expect(() => {
          // Simulate commander finding these commands
          const commandObj = program.commands.find(
            (cmd) => cmd.name() === command
          );
          expect(commandObj).toBeDefined();
        }).not.toThrow();
      }
    });

    test("REQ-SEC-001 — unknown commands are rejected immediately", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const maliciousCommands = [
        "malicious-command",
        "rm -rf /",
        "../../../etc/passwd",
        "eval(alert(1))",
        "DROP TABLE users",
      ];

      for (const maliciousCommand of maliciousCommands) {
        expect(() => {
          // Trigger unknown command handler
          program.emit("command:*", [maliciousCommand]);
        }).toThrow(/Unknown command:/);
      }
    });
  });

  describe("REQ-SEC-002: Input Sanitization and Validation", () => {
    test("REQ-SEC-002 — script injection attempts are properly sanitized", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const scriptInjections = [
        '<script>alert("xss")</script>',
        "</script><script>malicious()</script>",
        "javascript:alert(1)",
        '"><img src=x onerror=alert(1)>',
        "'; DROP TABLE users; --",
      ];

      for (const injection of scriptInjections) {
        try {
          program.emit("command:*", [injection]);
        } catch (error) {
          // Verify sanitized output doesn't contain original injection
          expect(error.message).not.toContain("<script>");
          expect(error.message).not.toContain("javascript:");

          // DROP TABLE should be sanitized (spaces replaced)
          if (injection.includes("DROP TABLE")) {
            expect(error.message).not.toContain("DROP TABLE");
            expect(error.message).toContain("DROP[SPACE]TABLE");
          }

          // Should contain escaped versions
          if (injection.includes("<script>")) {
            expect(error.message).toContain("&lt;");
            expect(error.message).toContain("&gt;");
          }
          if (injection.includes("javascript:")) {
            expect(error.message).toContain("[COLON]");
          }
        }
      }
    });

    test("REQ-SEC-002 — HTML entity encoding prevents injection", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const htmlInjections = [
        "<img src=x onerror=alert(1)>",
        "&lt;script&gt;alert()&lt;/script&gt;",
        '"onload="alert(1)"',
        "'onclick='alert(1)'",
      ];

      for (const injection of htmlInjections) {
        try {
          program.emit("command:*", [injection]);
        } catch (error) {
          // Verify proper HTML encoding
          expect(error.message).not.toContain("<img");
          expect(error.message).not.toContain("onload=");
          expect(error.message).not.toContain("onclick=");

          // Should contain encoded versions (but entities may be further sanitized)
          expect(error.message).toContain("&");
        }
      }
    });

    test("REQ-SEC-002 — input length is limited to prevent excessive output", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const longCommand = "a".repeat(1000); // Very long command

      try {
        program.emit("command:*", [longCommand]);
      } catch (error) {
        // Input should be truncated to 50 characters max
        const commandInMessage = error.message.match(
          /Unknown command: (.+)/
        )?.[1];
        expect(commandInMessage?.length).toBeLessThanOrEqual(52); // "Unknown command: " + 50 chars
      }
    });
  });

  describe("REQ-SEC-003: Information Disclosure Prevention", () => {
    test("REQ-SEC-003 — error messages don't reveal internal command structure", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      try {
        program.emit("command:*", ["unknown-command"]);
      } catch (error) {
        // Should not contain detailed command listing
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /❌ Invalid command: "unknown\[CHAR45\]command"/
          )
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(/Use --help to see available commands/)
        );

        // Should NOT contain internal command enumeration
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("Available commands:")
        );
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("npx claude-mcp-quickstart")
        );
      }
    });

    test("REQ-SEC-003 — help system only available through explicit flag", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      // Unknown command should not trigger help display
      try {
        program.emit("command:*", ["invalid"]);
      } catch (error) {
        // Should only show minimal help reference
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(/Use --help/)
        );

        // Should NOT show full help content
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("Configure MCP servers")
        );
        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining("Generate project prompt")
        );
      }
    });

    test("REQ-SEC-003 — security events are logged for monitoring", async () => {
      // Test in production mode for security logging
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        const { program } = await import("./index.js");

        // Mock process.exit to prevent test termination
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

        program.emit("command:*", ["malicious-command"]);

        // Should log security event
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(/\[SECURITY\] Unknown command attempted:/)
        );

        exitSpy.mockRestore();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe("REQ-SEC-004: Secure Default Behaviors", () => {
    test("REQ-SEC-004 — clean exit with appropriate error codes", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        const { program } = await import("./index.js");
        const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {});

        program.emit("command:*", ["unknown"]);

        // Should exit with error code 1
        expect(exitSpy).toHaveBeenCalledWith(1);

        exitSpy.mockRestore();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    test("REQ-SEC-004 — proper handling of test vs production environments", async () => {
      // Test environment should throw for testability
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      expect(() => {
        program.emit("command:*", ["test-command"]);
      }).toThrow(/Unknown command:/);

      // Production should exit (tested above)
    });

    test("REQ-SEC-004 — immediate termination for unknown commands", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const start = Date.now();

      try {
        program.emit("command:*", ["unknown"]);
      } catch (error) {
        const duration = Date.now() - start;
        // Should terminate quickly (< 100ms)
        expect(duration).toBeLessThan(100);
      }
    });
  });

  describe("REQ-SEC-005: Command Injection Prevention", () => {
    test("REQ-SEC-005 — shell metacharacters are properly escaped", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const shellMetacharacters = [
        "$(whoami)",
        "`whoami`",
        "; ls -la",
        "&& rm -rf /",
        "| cat /etc/passwd",
        "> /etc/passwd",
        "< /dev/null",
      ];

      for (const metachar of shellMetacharacters) {
        try {
          program.emit("command:*", [metachar]);
        } catch (error) {
          // Should not contain unescaped shell metacharacters
          expect(error.message).not.toContain("$(");
          expect(error.message).not.toContain("`");
          expect(error.message).not.toContain("; ");
          expect(error.message).not.toContain("&&");
          expect(error.message).not.toContain("|");
          // These should all be sanitized now

          // Should contain escaped versions
          if (metachar.includes("$(")) {
            expect(error.message).toContain("[DOLLAR]");
            expect(error.message).toContain("[LPAREN]");
          }
          if (metachar.includes("`")) {
            expect(error.message).toContain("[BACKTICK]");
          }
        }
      }
    });

    test("REQ-SEC-005 — no dynamic command execution occurs", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      // Mock child_process to ensure no command execution
      const execSpy = vi.fn();
      vi.doMock("child_process", () => ({
        exec: execSpy,
        spawn: execSpy,
        execSync: execSpy,
      }));

      const commandInjections = [
        "setup; rm -rf /",
        "dev-mode && malicious-command",
        "verify | evil-script",
      ];

      for (const injection of commandInjections) {
        try {
          program.emit("command:*", [injection]);
        } catch (error) {
          // Verify no child processes were spawned
          expect(execSpy).not.toHaveBeenCalled();
        }
      }
    });

    test("REQ-SEC-005 — path traversal attempts are blocked", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const pathTraversals = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "/etc/shadow",
        "C:\\Windows\\System32\\cmd.exe",
      ];

      for (const path of pathTraversals) {
        try {
          program.emit("command:*", [path]);
        } catch (error) {
          // Should sanitize path separators
          expect(error.message).not.toContain("../");
          expect(error.message).not.toContain("..\\");

          // Only check for escaped dots if path contains them
          if (path.includes("..")) {
            expect(error.message).toContain("[DOTDOT]"); // Escaped dot-dot
          }
        }
      }
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    test("handles null and undefined operands safely", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      // Test null operands
      expect(() => {
        program.emit("command:*", [null]);
      }).toThrow(/Unknown command: \[invalid-input\]/);

      // Test undefined operands
      expect(() => {
        program.emit("command:*", [undefined]);
      }).toThrow(/Unknown command: \[invalid-input\]/);

      // Test empty operands array
      expect(() => {
        program.emit("command:*", []);
      }).toThrow(/Unknown command: \[invalid-input\]/);
    });

    test("handles non-string inputs safely", async () => {
      process.env.NODE_ENV = "test";
      const { program } = await import("./index.js");

      const nonStringInputs = [
        123,
        { malicious: "object" },
        ["array", "input"],
        true,
        Symbol("test"),
      ];

      for (const input of nonStringInputs) {
        expect(() => {
          program.emit("command:*", [input]);
        }).toThrow(/Unknown command: \[invalid-input\]/);
      }
    });
  });
});
