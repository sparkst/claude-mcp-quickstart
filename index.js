#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

// Import commands
import setupQuickstart from "./setup.js";
import activateDevMode from "./dev-mode.js";

// ASCII banner
console.log(
  chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                  Claude MCP Quickstart                     ║
║                    Expert Edition v${packageJson.version}                   ║
╚═══════════════════════════════════════════════════════════╝
`)
);

program
  .name("claude-mcp-quickstart")
  .description("MCP configuration with expert multi-disciplinary assistance")
  .version(packageJson.version)
  .action(async () => {
    // Default action when no command is specified
    console.log(chalk.cyan("🔧 MCP Server Configuration"));
    console.log(chalk.gray("This will set up Claude Desktop with MCP servers for enhanced capabilities.\n"));
    console.log(chalk.yellow("📋 What happens next:"));
    console.log(chalk.gray("  1. Interactive wizard to configure API keys"));
    console.log(chalk.gray("  2. Creates Claude Desktop configuration file"));
    console.log(chalk.gray("  3. You'll need to restart Claude Desktop after completion"));
    console.log(chalk.gray("  4. Use 'dev-mode' command in your projects to generate integration prompts\n"));

    await setupQuickstart();
  });

program
  .command("setup")
  .description("Configure MCP servers and workspace")
  .action(async () => {
    await setupQuickstart();
  });

program
  .command("dev-mode")
  .description("Generate Claude integration prompt for current project")
  .action(async () => {
    console.log(chalk.cyan("📝 Project Integration Prompt Generator"));
    console.log(chalk.gray("Analyzes your project and creates a comprehensive prompt for Claude.\n"));
    console.log(chalk.yellow("📋 What this does:"));
    console.log(chalk.gray("  1. Detects your project type and structure"));
    console.log(chalk.gray("  2. Creates .claude-context and .claude-integration.md files"));
    console.log(chalk.gray("  3. Generates a ready-to-paste prompt for Claude"));
    console.log(chalk.gray("  4. Shows your available MCP capabilities\n"));
    console.log(chalk.yellow("💡 Usage: Copy the generated prompt and paste it into Claude\n"));

    await activateDevMode();
  });

program
  .command("verify")
  .description("Check MCP server configuration and status")
  .action(async () => {
    console.log(chalk.cyan("🔍 MCP Configuration Verification"));
    console.log(chalk.gray("Checks your Claude Desktop MCP setup for issues.\n"));
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
  .description("Complete setup: configure MCP servers + generate project prompt")
  .action(async () => {
    console.log(chalk.cyan("🚀 Complete MCP Setup + Project Integration"));
    console.log(chalk.gray("Runs both MCP server setup AND project integration in sequence.\n"));
    console.log(chalk.yellow("📋 This will:"));
    console.log(chalk.gray("  1. Configure MCP servers (interactive wizard)"));
    console.log(chalk.gray("  2. Generate project integration prompt"));
    console.log(chalk.gray("  3. Create all necessary files\n"));

    console.log(chalk.yellow("Step 1: Setting up MCP servers..."));
    await setupQuickstart();

    console.log(chalk.yellow("\nStep 2: Generating project integration..."));
    await activateDevMode();

    console.log(chalk.green.bold("\n🎉 Complete Setup Finished!\n"));
    console.log(chalk.cyan("📋 Next steps:"));
    console.log(chalk.gray("  1. Restart Claude Desktop (required for MCP servers)"));
    console.log(chalk.gray("  2. Copy the generated prompt above"));
    console.log(chalk.gray("  3. Paste it into a new Claude conversation"));
    console.log(chalk.gray("  4. Start building with enhanced capabilities!\n"));
  });

// Handle unknown commands - P0-009: Replace process.exit with error throwing for testability
program.on('command:*', function (operands) {
  const errorMessage = `\n❌ Unknown command: ${operands[0]}\n`;
  console.error(chalk.red(errorMessage));
  console.log(chalk.yellow("📋 Available commands:"));
  console.log(chalk.gray("  npx claude-mcp-quickstart          # Configure MCP servers"));
  console.log(chalk.gray("  npx claude-mcp-quickstart setup    # Same as above"));
  console.log(chalk.gray("  npx claude-mcp-quickstart dev-mode # Generate project prompt"));
  console.log(chalk.gray("  npx claude-mcp-quickstart verify   # Check configuration"));
  console.log(chalk.gray("  npx claude-mcp-quickstart quick-start # Complete setup"));
  console.log(chalk.gray("  npx claude-mcp-quickstart --help   # Show help"));
  console.log(chalk.gray("  npx claude-mcp-quickstart --version # Show version\n"));
  console.log(chalk.cyan("💡 For detailed guidance, see: npx claude-mcp-quickstart --help"));

  // P0-009: Only exit if not in test environment, otherwise throw for testability
  if (process.env.NODE_ENV === 'test') {
    throw new Error(`Unknown command: ${operands[0]}`);
  } else {
    process.exit(1);
  }
});

// P0-009: Conditional execution based on environment for testability
if (process.env.NODE_ENV !== 'test') {
  try {
    program.parse();
  } catch (error) {
    console.error(chalk.red('CLI Error:'), error.message);
    process.exit(1);
  }
}

// Export for testing
export { program };
