#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import commands
import setupQuickstart from "./setup.js";
import activateDevMode from "./dev-mode.js";

// ASCII banner
console.log(
  chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                  Claude MCP Quickstart                     ║
║                    Expert Edition v2.0                     ║
╚═══════════════════════════════════════════════════════════╝
`)
);

program
  .name("claude-mcp-quickstart")
  .description("MCP configuration with expert multi-disciplinary assistance")
  .version("2.0.0")
  .action(async () => {
    // Default action when no command is specified
    console.log(
      chalk.cyan("🚀 Running setup (use --help to see all commands)\n")
    );
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
  .description("Activate expert development mode")
  .action(async () => {
    await activateDevMode();
  });

program
  .command("verify")
  .description("Verify MCP configuration")
  .action(async () => {
    console.log(chalk.cyan("\n🔍 Verifying Configuration\n"));

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
  .description("Complete setup with all features")
  .action(async () => {
    console.log(chalk.cyan.bold("\n🚀 Quick Start\n"));

    console.log(chalk.yellow("Step 1: Setup MCP servers..."));
    await setupQuickstart();

    console.log(chalk.yellow("\nStep 2: Activating Dev Mode..."));
    await activateDevMode();

    console.log(chalk.green.bold("\n🎉 Setup Complete!\n"));
    console.log(chalk.cyan("Next steps:"));
    console.log("1. Restart Claude Desktop");
    console.log('2. Say "Dev Mode" to activate');
    console.log("3. Start building!\n");
  });

program.parse();
