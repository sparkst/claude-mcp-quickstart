#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * Escapes text for safe markdown rendering
 */
function escapeMarkdown(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/\\/g, "&#x5C;");
}

/**
 * Safely formats server list for JSON context
 */
function formatServerList(mcpServers) {
  if (!Array.isArray(mcpServers)) return '"memory", "supabase"';
  return mcpServers
    .filter((s) => typeof s === "string" && s.trim())
    .map((s) => `"${escapeMarkdown(s)}"`)
    .join(", ");
}

/**
 * Creates the brain connection file with enhanced integration prompt
 * REQ-202: Creates connect_claude_brain.md file in current directory
 */
export async function createBrainConnectionFile(
  projectPath,
  mcpServers,
  projectType = "Node.js"
) {
  const filePath = path.join(projectPath, "connect_claude_brain.md");

  // Escape all user inputs for safe markdown rendering
  const safePath = escapeMarkdown(projectPath);
  const safeType = escapeMarkdown(projectType);
  const safeServers = Array.isArray(mcpServers)
    ? mcpServers.filter((s) => typeof s === "string").map(escapeMarkdown)
    : ["memory", "supabase"];
  const serverList = formatServerList(mcpServers);
  const configPath = escapeMarkdown(
    path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    )
  );

  const prompt = `# 🧠 Claude Brain Connection

Hi Claude! Your MCP workspace is ready. Please confirm the setup and provide next steps guidance.

## 📁 Workspace Context
- **Project Directory**: \`${safePath}\`
- **Project Type**: ${safeType}
- **MCP Configuration**: \`${configPath}\`

## 🛠️ Available MCP Tools
${safeServers.map((server) => `- **${server}**: Configured and ready`).join("\n") || "- **memory**: Save and recall project context\n- **supabase**: Interact with databases and APIs"}

## 🧠 Please Save This Context
Use your memory to save:
\`\`\`
Primary workspace: ${safePath}
Project type: ${safeType}
Available MCP tools: ${serverList}
Context file: .claude-context (in project root)
\`\`\`

## 🚀 Ready to Develop!
You can now help with:
- **Code analysis**: "Analyze the structure of this ${safeType} project"
- **Research**: "Find best practices for ${safeType} development"
- **Problem solving**: "Help me debug this issue"
- **Documentation**: "Look up how to use [library]"

## 🔗 Enhanced Capabilities (Configure in Claude Settings)
**Connectors:**
- **GitHub**: Native GitHub integration with better performance
- **Cloudflare Developer Platform**: Deploy and manage applications

**Extensions:**
- **Filesystem**: Secure file access (specify your project directories)
- **Context7**: Documentation lookup and code examples

## 📋 Quick Start Commands
\`\`\`
"Save this workspace context to memory"
"Analyze my project structure" 
"Search for ${safeType} best practices"
"Help me explore this codebase"
\`\`\`

## ⚠️ IMPORTANT: Confirm Connection
When you've successfully loaded this workspace and verified your MCP tools are working, please create a status file to confirm the connection:

**Create file:** \`claude_brain_connected.json\`
**Content:**
\`\`\`json
{
  "status": "connected",
  "timestamp": "${new Date().toISOString()}",
  "mcp_servers_verified": [${serverList}],
  "workspace_loaded": true,
  "next_steps": "I've successfully connected to your MCP workspace! You can now ask me to analyze your project, search for documentation, save context to memory, or help with any development tasks. Your MCP servers are active and ready to enhance our collaboration."
}
\`\`\`

Ready to build something amazing together! 🎉`;

  await fs.writeFile(filePath, prompt, "utf8");
  return filePath;
}

/**
 * Displays the brain connection prompt on screen with premium UX copy
 * REQ-203: Displays prompt and enters waiting mode with spinner
 */
export function displayBrainConnectionPrompt(filePath) {
  console.log(chalk.cyan("\n🧠 Ready to connect your Claude brain?\n"));

  console.log(
    chalk.gray(
      "Your MCP servers are configured and waiting. Let's bring Claude online!\n"
    )
  );

  console.log(
    chalk.green("📄 Connection prompt saved to:"),
    path.basename(filePath)
  );

  console.log(chalk.cyan("\n🚀 Next: Open Claude and either:"));
  console.log(chalk.gray("• Copy the prompt from the file"));
  console.log(chalk.gray("• Upload connect_claude_brain.md directly\n"));

  console.log(chalk.cyan("💡 Open Claude now for the smoothest experience!\n"));

  console.log(chalk.gray("─".repeat(60)));
}

/**
 * Watches for Claude success detection file
 * REQ-204: Watches for claude_brain_connected.json file creation
 */
export async function waitForClaudeConnection(projectPath, timeoutMs = 300000) {
  const statusFilePath = path.join(projectPath, "claude_brain_connected.json");
  const startTime = Date.now();
  let checkDelay = 100; // Start with 100ms
  let intervalId = null;

  return new Promise((resolve, reject) => {
    const scheduleNextCheck = () => {
      intervalId = setTimeout(async () => {
        try {
          // Check if file exists and is readable
          await fs.access(statusFilePath);
          const content = await fs.readFile(statusFilePath, "utf8");

          // Validate JSON before parsing
          if (!content.trim()) {
            throw new Error("Empty status file");
          }

          let status;
          try {
            status = JSON.parse(content);
          } catch (parseError) {
            throw new Error(
              `Malformed JSON in status file: ${parseError.message}`
            );
          }

          // Comprehensive validation of required fields
          if (!status || typeof status !== "object") {
            throw new Error("Invalid status object: not an object");
          }

          if (!status.status || typeof status.status !== "string") {
            throw new Error(
              "Invalid status object: missing or invalid status field"
            );
          }

          if (!status.timestamp || typeof status.timestamp !== "string") {
            throw new Error(
              "Invalid status object: missing or invalid timestamp field"
            );
          }

          if (
            status.mcp_servers_verified &&
            !Array.isArray(status.mcp_servers_verified)
          ) {
            throw new Error(
              "Invalid status object: mcp_servers_verified must be an array"
            );
          }

          if (
            status.workspace_loaded !== undefined &&
            typeof status.workspace_loaded !== "boolean"
          ) {
            throw new Error(
              "Invalid status object: workspace_loaded must be a boolean"
            );
          }

          // Clear timeout and resolve
          if (intervalId) {
            clearTimeout(intervalId);
            intervalId = null;
          }
          resolve(status);
        } catch {
          // Check for timeout
          if (Date.now() - startTime > timeoutMs) {
            if (intervalId) {
              clearTimeout(intervalId);
              intervalId = null;
            }
            reject(new Error("Timeout waiting for Claude connection"));
            return;
          }

          // If file doesn't exist or is invalid, continue waiting with exponential backoff
          checkDelay = Math.min(checkDelay * 1.2, 2000); // Exponential backoff, max 2 seconds
          scheduleNextCheck();
        }
      }, checkDelay);
    };

    // Start the first check
    scheduleNextCheck();
  });
}

/**
 * Handles timeout with graceful fallback
 * REQ-205: Handles 5-minute timeout with graceful fallback
 */
export function handleConnectionTimeout(projectPath) {
  console.log(
    chalk.yellow("\n⏰ No worries! You can connect Claude anytime.\n")
  );

  console.log(chalk.gray("The connection prompt is saved in your project:"));
  console.log(
    chalk.green("📄 Connection prompt saved to:"),
    "connect_claude_brain.md"
  );

  console.log(chalk.cyan("\nTo connect later:"));
  console.log(chalk.gray("• Open the file in Claude"));
  console.log(chalk.gray("• Or run: claude-mcp-quickstart dev-mode"));
  console.log(
    chalk.gray("• Follow the instructions to create the status file\n")
  );

  console.log(chalk.green("✅ Your MCP setup is complete and ready to use!"));

  return {
    reason: "timeout",
    timestamp: new Date().toISOString(),
    fallbackProvided: true,
    guidance: [
      "Open connect_claude_brain.md in Claude",
      "Run claude-mcp-quickstart dev-mode",
      "Create claude_brain_connected.json status file",
    ],
    files: {
      connectionPrompt: path.join(projectPath, "connect_claude_brain.md"),
      expectedStatusFile: path.join(projectPath, "claude_brain_connected.json"),
    },
  };
}

/**
 * Displays Claude connection success
 */
export function displayConnectionSuccess(status) {
  // Validate status object structure
  if (!status || typeof status !== "object") {
    console.error(chalk.red("Error: Invalid status object provided"));
    return;
  }

  console.log(chalk.green("\n🎉 Claude brain connected successfully!\n"));

  if (
    status.mcp_servers_verified &&
    Array.isArray(status.mcp_servers_verified) &&
    status.mcp_servers_verified.length > 0
  ) {
    console.log(chalk.gray("Verified MCP servers:"));
    status.mcp_servers_verified.forEach((server) => {
      if (typeof server === "string") {
        console.log(chalk.green(`   ✓ ${server}`));
      }
    });
  }

  if (status.next_steps && typeof status.next_steps === "string") {
    console.log(chalk.cyan("\n💡 What's next:"));
    console.log(chalk.gray(`   ${status.next_steps}\n`));
  }

  console.log(chalk.green("🚀 Happy coding with your enhanced Claude setup!"));
}

/**
 * Creates success result for brain connection
 */
function createSuccessResult(status, projectPath, projectType, mcpServers) {
  return {
    success: true,
    status,
    timestamp: new Date().toISOString(),
    reason: "connected",
    metadata: {
      projectPath,
      projectType,
      serversConfigured: mcpServers?.length || 0,
    },
  };
}

/**
 * Creates timeout result for brain connection
 */
function createTimeoutResult(timeoutInfo, projectPath, projectType) {
  return {
    success: false,
    reason: "timeout",
    timestamp: new Date().toISOString(),
    timeoutInfo,
    metadata: {
      projectPath,
      projectType,
      timeoutDuration: 300000,
      fallbackProvided: true,
    },
  };
}

/**
 * Creates error result for brain connection
 */
function createErrorResult(error, projectPath, projectType) {
  return {
    success: false,
    reason: "error",
    timestamp: new Date().toISOString(),
    error: error.message,
    metadata: {
      projectPath: projectPath || "unknown",
      projectType: projectType || "unknown",
      phase: "initialization",
    },
  };
}

/**
 * Handles the core connection flow with spinner
 */
async function executeConnectionFlow(projectPath, spinner) {
  try {
    const status = await waitForClaudeConnection(projectPath);
    spinner.succeed(chalk.green("Claude connected!"));
    displayConnectionSuccess(status);
    return { success: true, status };
  } catch (error) {
    if (error.message.includes("Timeout")) {
      spinner.warn(chalk.yellow("Connection timeout"));
      const timeoutInfo = handleConnectionTimeout(projectPath);
      return { success: false, timeoutInfo };
    } else {
      spinner.fail(chalk.red("Connection error"));
      return { success: false, error };
    }
  }
}

/**
 * Main brain connection orchestration function
 * REQ-201: Integrates brain connection in setup completion
 */
export async function initiateBrainConnection(
  projectPath,
  mcpServers,
  projectType = "Node.js"
) {
  try {
    const filePath = await createBrainConnectionFile(
      projectPath,
      mcpServers,
      projectType
    );
    displayBrainConnectionPrompt(filePath);

    const spinner = ora({
      text: chalk.cyan("Waiting for Claude to connect..."),
      color: "cyan",
    }).start();

    const result = await executeConnectionFlow(projectPath, spinner);

    if (result.success) {
      return createSuccessResult(
        result.status,
        projectPath,
        projectType,
        mcpServers
      );
    } else if (result.timeoutInfo) {
      return createTimeoutResult(result.timeoutInfo, projectPath, projectType);
    } else {
      return createErrorResult(result.error, projectPath, projectType);
    }
  } catch (error) {
    console.error(chalk.red("Error during brain connection:"), error.message);
    return createErrorResult(error, projectPath, projectType);
  }
}

export default initiateBrainConnection;
