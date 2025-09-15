#!/usr/bin/env node

/**
 * REQ-PERF-001: High-performance CLI entry point
 * Optimizes startup time by lazy loading all heavy dependencies
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

// REQ-PERF-002: Early exit for simple commands to avoid loading heavy modules
const args = process.argv.slice(2);
const isVersionCommand = args.includes('--version') || args.includes('-v');
const isHelpCommand = args.includes('--help') || args.includes('-h');

// REQ-PERF-003: Handle version command immediately without loading commander
if (isVersionCommand) {
  console.log(packageJson.version);
  process.exit(0);
}

// REQ-PERF-004: Fast help display without loading full CLI
if (isHelpCommand && args.length === 1) {
  console.log(`Claude MCP Quickstart v${packageJson.version}

Usage: claude-mcp-quickstart [command]

Commands:
  setup        Configure MCP servers and workspace
  dev-mode     Generate Claude integration prompt for current project
  verify       Check MCP server configuration and status
  quick-start  Complete setup: configure MCP servers + generate project prompt

Options:
  -v, --version  Show version
  -h, --help     Show help

For more information, see: https://github.com/sparkst/claude-mcp-quickstart`);
  process.exit(0);
}

// REQ-PERF-005: Lazy load all heavy dependencies only when needed
const loadDependencies = async () => {
  const { program } = await import("commander");
  const chalk = (await import("chalk")).default;
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  return { program, chalk, fs, path, os };
};

// REQ-PERF-006: Performance-optimized banner display
function showBanner(chalk) {
  console.log(
    chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                  Claude MCP Quickstart                     ║
║                    Expert Edition v${packageJson.version}                   ║
╚═══════════════════════════════════════════════════════════╝
`)
  );
}

// REQ-PERF-007: Initialize CLI only after checking for fast-path commands
async function initializeCLI() {
  const { program, chalk, fs, path, os } = await loadDependencies();

  // Performance: skip banner for version/help commands
  const skipBannerCommands = ["--version", "-v", "--help", "-h"];
  const shouldShowBanner = !process.argv.some((arg) =>
    skipBannerCommands.includes(arg)
  );

  if (shouldShowBanner) {
    showBanner(chalk);
  }

  program
    .name("claude-mcp-quickstart")
    .description("MCP configuration with expert multi-disciplinary assistance")
    .version(packageJson.version)
    .action(async () => {
      // Default action when no command is specified
      if (!shouldShowBanner) showBanner(chalk); // Show banner if not already shown

      console.log(chalk.cyan("🔧 MCP Server Configuration"));
      console.log(
        chalk.gray(
          "This will set up Claude Desktop with MCP servers for enhanced capabilities.\n"
        )
      );
      console.log(chalk.yellow("📋 What happens next:"));
      console.log(chalk.gray("  1. Interactive wizard to configure API keys"));
      console.log(chalk.gray("  2. Creates Claude Desktop configuration file"));
      console.log(
        chalk.gray("  3. You'll need to restart Claude Desktop after completion")
      );
      console.log(
        chalk.gray(
          "  4. Use 'dev-mode' command in your projects to generate integration prompts\n"
        )
      );

      // Lazy load setup module only when needed
      const { default: setupQuickstart } = await import("./setup.js");
      await setupQuickstart();
    });

  program
    .command("setup")
    .description("Configure MCP servers and workspace")
    .action(async () => {
      if (!shouldShowBanner) showBanner(chalk);
      // Lazy load setup module
      const { default: setupQuickstart } = await import("./setup.js");
      await setupQuickstart();
    });

  program
    .command("dev-mode")
    .description("Generate Claude integration prompt for current project")
    .action(async () => {
      if (!shouldShowBanner) showBanner(chalk);

      console.log(chalk.cyan("📝 Project Integration Prompt Generator"));
      console.log(
        chalk.gray(
          "Analyzes your project and creates a comprehensive prompt for Claude.\n"
        )
      );
      console.log(chalk.yellow("📋 What this does:"));
      console.log(chalk.gray("  1. Detects your project type and structure"));
      console.log(
        chalk.gray(
          "  2. Creates .claude-context and .claude-integration.md files"
        )
      );
      console.log(
        chalk.gray("  3. Generates a ready-to-paste prompt for Claude")
      );
      console.log(chalk.gray("  4. Shows your available MCP capabilities\n"));
      console.log(
        chalk.yellow(
          "💡 Usage: Copy the generated prompt and paste it into Claude\n"
        )
      );

      // Lazy load dev-mode module
      const { default: activateDevMode } = await import("./dev-mode.js");
      await activateDevMode();
    });

  program
    .command("verify")
    .description("Check MCP server configuration and status")
    .action(async () => {
      if (!shouldShowBanner) showBanner(chalk);

      console.log(chalk.cyan("🔍 MCP Configuration Verification"));
      console.log(
        chalk.gray("Checks your Claude Desktop MCP setup for issues.\n")
      );
      console.log(chalk.yellow("📋 Checking:"));
      console.log(chalk.gray("  • MCP server configuration"));
      console.log(chalk.gray("  • Workspace directory setup"));
      console.log(chalk.gray("  • Required and optional components\n"));

      const configPath = path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      );

      try {
        const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
        const servers = Object.keys(config.mcpServers || {});

        console.log(chalk.yellow("MCP Servers:"));
        const required = ["filesystem", "memory"];
        const optional = ["github", "brave-search", "tavily-search"];

        [...required, ...optional].forEach((server) => {
          const isRequired = required.includes(server);
          const isConfigured = servers.includes(server);

          if (isConfigured) {
            console.log(chalk.green(`  ✓ ${server}`));
          } else if (isRequired) {
            console.log(chalk.red(`  ✗ ${server} (required)`));
          } else {
            console.log(chalk.gray(`  - ${server} (optional)`));
          }
        });

        // Check workspace
        const workspacePath = path.join(os.homedir(), "claude-mcp-workspace");
        console.log(chalk.yellow("\nWorkspace:"));

        try {
          await fs.access(workspacePath);
          console.log(chalk.green(`  ✓ ${workspacePath}`));

          // Check context files
          const contextFiles = [
            "DEV_MODE.md",
            "BOOTSTRAP_LOVABLE.md",
            "PRINCIPLES.md",
          ];
          console.log(chalk.yellow("\nContext Files:"));

          for (const file of contextFiles) {
            try {
              await fs.access(path.join(workspacePath, file));
              console.log(chalk.green(`  ✓ ${file}`));
            } catch {
              console.log(chalk.gray(`  - ${file}`));
            }
          }
        } catch {
          console.log(chalk.red(`  ✗ Workspace not found`));
        }

        console.log(chalk.cyan("\n✅ Verification complete\n"));
      } catch (error) {
        console.error(chalk.red("Verification failed:"), error.message);
      }
    });

  program
    .command("quick-start")
    .description(
      "Complete setup: configure MCP servers + generate project prompt"
    )
    .action(async () => {
      if (!shouldShowBanner) showBanner(chalk);

      console.log(chalk.cyan("🚀 Complete MCP Setup + Project Integration"));
      console.log(
        chalk.gray(
          "Runs both MCP server setup AND project integration in sequence.\n"
        )
      );
      console.log(chalk.yellow("📋 This will:"));
      console.log(chalk.gray("  1. Configure MCP servers (interactive wizard)"));
      console.log(chalk.gray("  2. Generate project integration prompt"));
      console.log(chalk.gray("  3. Create all necessary files\n"));

      console.log(chalk.yellow("Step 1: Setting up MCP servers..."));
      // Lazy load modules
      const { default: setupQuickstart } = await import("./setup.js");
      await setupQuickstart();

      console.log(chalk.yellow("\nStep 2: Generating project integration..."));
      const { default: activateDevMode } = await import("./dev-mode.js");
      await activateDevMode();

      console.log(chalk.green.bold("\n🎉 Complete Setup Finished!\n"));
      console.log(chalk.cyan("📋 Next steps:"));
      console.log(
        chalk.gray("  1. Restart Claude Desktop (required for MCP servers)")
      );
      console.log(chalk.gray("  2. Copy the generated prompt above"));
      console.log(chalk.gray("  3. Paste it into a new Claude conversation"));
      console.log(
        chalk.gray("  4. Start building with enhanced capabilities!\n")
      );
    });

  // REQ-SEC-001: Secure command validation with allowlisting
  const ALLOWED_COMMANDS = new Set([
    "setup",
    "dev-mode",
    "verify",
    "quick-start",
  ]);

  /**
   * REQ-SEC-002: Sanitize user input to prevent injection attacks
   * @param {string} input - Raw user input
   * @returns {string} - Sanitized input safe for output
   */
  function sanitizeInput(input) {
    if (input === null || input === undefined) {
      return "[invalid-input]";
    }

    if (typeof input !== "string") {
      return "[invalid-input]";
    }

    // REQ-SEC-002: Comprehensive sanitization for all injection vectors
    // Use a mapping approach to avoid semicolon conflicts
    const charMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
      "/": "[SLASH]",
      "\\": "[BACKSLASH]",
      $: "[DOLLAR]",
      "`": "[BACKTICK]",
      "|": "[PIPE]",
      ";": "[SEMICOLON]",
      ":": "[COLON]",
      "(": "[LPAREN]",
      ")": "[RPAREN]",
      ".": "[DOT]",
      " ": "[SPACE]",
      "\t": "[TAB]",
      "\n": "[NEWLINE]",
      "\r": "[CR]",
    };

    let result = "";
    for (let i = 0; i < input.length && i < 50; i++) {
      const char = input[i];
      // Also sanitize any character that's not alphanumeric
      if (charMap[char]) {
        result += charMap[char];
      } else if (/[a-zA-Z0-9]/.test(char)) {
        result += char;
      } else {
        result += `[CHAR${char.charCodeAt(0)}]`;
      }
    }

    // Handle path traversal specifically
    return result.replace(/\[DOT\]\[DOT\]/g, "[DOTDOT]");
  }

  /**
   * REQ-SEC-003: Secure error handling without information disclosure
   * @param {string} command - The unknown command (will be sanitized)
   */
  function handleUnknownCommand(command) {
    const sanitizedCommand = sanitizeInput(command);

    // REQ-SEC-003: Minimal error message without command enumeration
    const errorMessage = `❌ Invalid command: "${sanitizedCommand}"`;
    console.error(chalk.red(errorMessage));

    // REQ-SEC-003: Only show help reference, not full command list
    console.log(chalk.gray("Use --help to see available commands"));

    // REQ-SEC-005: Log security event for monitoring (sanitized)
    if (process.env.NODE_ENV !== "test") {
      console.error(`[SECURITY] Unknown command attempted: ${sanitizedCommand}`);
    }
  }

  // REQ-SEC-001: Secure unknown command handler with strict validation
  program.on("command:*", function (operands) {
    const unknownCommand =
      operands && operands.length > 0 ? operands[0] : undefined;

    // REQ-SEC-001: Check against allowlist first
    if (!ALLOWED_COMMANDS.has(unknownCommand)) {
      handleUnknownCommand(unknownCommand);

      // REQ-SEC-004: Clean termination with appropriate error code
      if (process.env.NODE_ENV === "test") {
        // REQ-SEC-004: Throw for testability, include sanitized command
        throw new Error(`Unknown command: ${sanitizeInput(unknownCommand)}`);
      } else {
        // REQ-SEC-004: Secure exit in production
        process.exit(1);
      }
    }
  });

  // Return the program for testability
  return program;
}

// REQ-PERF-008: Main execution with error handling
async function main() {
  try {
    const program = await initializeCLI();

    // P0-009: Conditional execution based on environment for testability
    if (process.env.NODE_ENV !== "test") {
      program.parse();
    }

    return program;
  } catch (error) {
    const chalk = (await import("chalk")).default;
    console.error(chalk.red("CLI Error:"), error.message);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw error;
  }
}

// Execute main function and export for testing
const programPromise = main();

export { programPromise as program };