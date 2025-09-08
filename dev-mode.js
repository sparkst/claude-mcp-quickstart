#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import os from "os";

const DEV_MODE_ACTIVE = `
# DEV MODE ACTIVE

Expert multi-disciplinary mode engaged.

## Active Capabilities
✓ Supabase MCP - Database operations
✓ GitHub MCP - Code management
✓ Context7 MCP - Documentation search
✓ Filesystem MCP - Local operations
✓ Memory MCP - Knowledge persistence

## Operating Mode
- Implementation focus
- Quality without complexity
- User-centric decisions
- Data-driven choices

## Commands

### Build
"new feature [description]" → Implementation
"fix [issue]" → Debug and resolve
"optimize [component]" → Performance
"test [feature]" → Test coverage

### Analyze
"review [code]" → Code review
"audit [system]" → Security check
"profile [component]" → Performance
"investigate [issue]" → Root cause

### Deploy
"ship it" → Deployment checklist
"rollback" → Revert changes
"migrate" → Database updates
"scale" → Performance tuning

## Context Loaded From
`;

async function activateDevMode() {
  console.log(chalk.cyan("\n⚡ Activating Dev Mode\n"));

  try {
    const workspacePath = path.join(os.homedir(), "claude-mcp-workspace");

    // Check context files
    console.log(chalk.yellow("Checking context:"));
    const contextFiles = [
      "DEV_MODE.md",
      "BOOTSTRAP_LOVABLE.md",
      "PRINCIPLES.md",
    ];

    for (const file of contextFiles) {
      try {
        await fs.access(path.join(workspacePath, file));
        console.log(chalk.green(`  ✓ ${file}`));
      } catch {
        console.log(chalk.red(`  ✗ ${file} (missing)`));
      }
    }

    // Check MCP servers
    console.log(chalk.yellow("\nChecking MCP servers:"));
    const configPath = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );

    try {
      const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
      const servers = Object.keys(config.mcpServers || {});

      ["filesystem", "memory", "github", "supabase", "context7"].forEach(
        (server) => {
          if (servers.includes(server)) {
            console.log(chalk.green(`  ✓ ${server}`));
          } else {
            console.log(chalk.yellow(`  ⚠ ${server} (not configured)`));
          }
        },
      );
    } catch {
      console.log(chalk.red("  ✗ Could not read configuration"));
    }

    // Create activation marker
    const timestamp = new Date().toISOString();
    await fs.writeFile(
      path.join(workspacePath, "ACTIVE.md"),
      DEV_MODE_ACTIVE +
        `
- Workspace: ${workspacePath}
- Activated: ${timestamp}
- Mode: Expert Multi-Disciplinary

## Activation Phrase

Copy and paste into Claude:

"Dev Mode: Initialize expert mode with Bootstrap Lovable 2.0"

---
*Quality without complexity. Ship fast, maintain forever.*
`,
    );

    console.log(chalk.green("\n✅ Dev Mode Activated!\n"));
    console.log(chalk.cyan("Test commands:"));
    console.log(chalk.gray('  "Dev Mode: check setup"'));
    console.log(chalk.gray('  "Dev Mode: analyze my code"'));
    console.log(chalk.gray('  "Dev Mode: create auth flow"'));
    console.log(chalk.gray('  "Dev Mode: optimize database"\n'));
  } catch (error) {
    console.error(chalk.red("Activation failed:"), error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  activateDevMode();
}

export default activateDevMode;
