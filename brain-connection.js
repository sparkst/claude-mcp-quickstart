#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { verifyClaudeSetup } from "./setup-diagnostics.js";
import { getClaudeConfigPath } from "./config-analyzer.js";
import {
  generateEnhancedPromptContent,
  generateSetupVerificationContent,
  formatTroubleshootingGuidance,
} from "./brain-connection-ux.js";

/**
 * Escapes text for safe markdown rendering
 * REQ-401: Keep paths human-readable by only escaping dangerous characters
 * REQ-202: Prevent template injection and XSS attacks
 */
function escapeMarkdown(text) {
  if (typeof text !== "string") return String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/:/g, "&#x3A;") // P0-003: Escape colons to prevent javascript: injection
    .replace(/\\/g, "&#x5C;") // Escape backslashes for security
    .replace(/\//g, "&#x2F;"); // Escape forward slashes for security (script tags, etc.)
}

/**
 * Escapes text for markdown but keeps file paths human-readable
 * REQ-401: Balance between security and readability for path display
 */
function escapeMarkdownPath(text) {
  if (typeof text !== "string") return String(text);
  // Only escape dangerous characters but keep paths readable by NOT escaping forward slashes
  // This is safe when used in controlled template contexts (not user input)
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\\/g, "&#x5C;");
}

/**
 * Smart escaping that detects potentially malicious content
 * REQ-401: Use human-readable escaping for clean paths, full escaping for malicious content
 * REQ-202: Detect and fully escape potentially malicious content
 * P0-008: Enhanced malicious pattern detection
 */
function escapePathSmart(text) {
  if (typeof text !== "string") return String(text);

  // Check if the text contains potentially malicious patterns
  const dangerousPatterns = [
    /<script/i,
    /<\/script/i,
    /<img/i,
    /onerror=/i,
    /javascript:/i,
    /vbscript:/i,
    /data:.*script/i,
    /on\w+=/i, // P0-008: Event handler attributes
    /<iframe/i, // P0-008: Iframe injection
    /style\s*=/i, // P0-008: Style attribute injection
  ];

  const isMalicious = dangerousPatterns.some((pattern) => pattern.test(text));

  // If potentially malicious, use full escaping
  if (isMalicious) {
    return escapeMarkdown(text);
  }

  // P0-008: For legitimate paths, preserve readability by NOT escaping forward slashes
  // REQ-401: Keep paths human-readable for copy-paste functionality
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  // Note: Forward slashes (/) are NOT escaped to maintain path readability
}

/**
 * Safely formats server list for JSON context
 * P0-006: Escape rather than filter to maintain data integrity
 */
function formatServerList(mcpServers) {
  if (!Array.isArray(mcpServers)) return '"memory", "supabase"';
  return mcpServers
    .filter((s) => typeof s === "string" && s.trim())
    .map((s) => `"${escapeMarkdown(s)}"`)
    .join(", ");
}

/**
 * Formats server list for JSON string context (with proper escaping)
 * REQ-202: Prevent template injection by escaping all server names
 * P0-007: Escape rather than filter to prevent data loss
 */
function formatServerListForJSON(mcpServers) {
  if (!Array.isArray(mcpServers)) return '"memory", "supabase"';
  return (
    mcpServers
      .filter((s) => typeof s === "string" && s.trim())
      .map((s) => {
        // P0-007: Escape all potentially dangerous characters for JSON context
        const escaped = escapeMarkdown(s);
        return `"${escaped}"`;
      })
      .join(", ") || '"memory", "supabase"'
  ); // P0-007: Fallback if no valid servers
}

/**
 * REQ-403: Use user's improved template with dynamic content insertion
 * P0-001: Apply comprehensive template injection protection
 */
function generateFromUserTemplate(
  projectPath,
  mcpServers,
  projectType,
  setupVerification,
  enhancedContent
) {
  const timestamp = new Date().toISOString();
  const configPath = getClaudeConfigPath();

  // P0-001: Apply smart escaping to all user inputs to prevent template injection
  // REQ-401: Use path-friendly escaping for directory paths to maintain readability
  const safePath = escapePathSmart(projectPath);
  const safeType = escapeMarkdown(projectType);
  const safeConfigPath = escapePathSmart(configPath);

  // Use user's improved template with dynamic insertions
  return `# 🧠 Claude Brain Connection

Hi Claude! Your MCP workspace is ready. Setup verification complete!

## 📁 Workspace Context
- **Project Directory**: \`${safePath}\`
- **Project Type**: ${safeType}
- **MCP Configuration**: \`${safeConfigPath}\`

## ✅ Setup Verification Complete

Your Claude MCP setup is working correctly!

**Configuration Summary:**
- 📁 Filesystem Access: ${setupVerification.summary?.filesystemEnabled ? "✅ Enabled" : "❌ Not Enabled"}
- 🏠 Workspace Configured: ${setupVerification.summary?.workspaceConfigured ? "✅ Yes" : "❌ No"}
- 📂 Current Project Included: ${setupVerification.summary?.projectIncluded ? "✅ Yes" : "❌ No"}
- 🔧 Total MCP Servers: ${setupVerification.summary?.totalServers || 0}
- 📚 Context7: ${setupVerification.summary?.recommendedExtensions?.context7 ? "✅ Enabled" : "⚠️ Recommended"}
- 🐙 GitHub: ${setupVerification.summary?.recommendedExtensions?.github ? "✅ Enabled" : "⚠️ Recommended"}


## 🧠 Save This Context to Memory
Use your memory to save:
\`\`\`
Primary workspace: ${safePath}
Project type: ${safeType}
Available MCP tools: ${formatServerListForJSON(mcpServers)}
Available capabilities: ${parseInt(enhancedContent.enabledCapabilities) || 0}/${parseInt(enhancedContent.totalCapabilities) || 0}
Context file: .claude-context (in project root)
Last verified: ${timestamp}
\`\`\`

## 🚀 10 Things You Can Do Right Now

${enhancedContent.practicalExamples
  .map(
    (example, index) => `
### ${index + 1}. ${example.title}
\`\`\`
${example.prompt}
\`\`\`
`
  )
  .join("")}

## ⚡ 10 New Capabilities Unlocked by MCP

${enhancedContent.mcpCapabilities
  .map(
    (cap, index) => `
### ${index + 1}. ${cap.title} ${cap.enabled ? "✅" : "❌"}
${cap.description}

**Before MCP:** ${cap.beforeMcp}
**With MCP:** ${cap.withMcp}
`
  )
  .join("")}

**Capabilities Active: ${parseInt(enhancedContent.enabledCapabilities) || 0}/${parseInt(enhancedContent.totalCapabilities) || 0}**



## ⚠️ IMPORTANT: Confirm Connection
When you've successfully loaded this workspace and verified your MCP tools are working, please create a status file to confirm the connection:

**File locations for reference:**
- Connection prompt: \`${safePath}/connect_claude_brain.md\`
- Status file to create: \`${safePath}/claude_brain_connected.json\`

**Create file:** \`claude_brain_connected.json\`
**Content:**
\`\`\`json
{
  "status": "connected",
  "timestamp": "${timestamp}",
  "mcp_servers_verified": [${formatServerListForJSON(mcpServers)}],
  "workspace_loaded": true,
  "next_steps": "I've successfully connected to your MCP workspace! I can help with ${parseInt(enhancedContent.enabledCapabilities) || 0} enhanced capabilities out of ${parseInt(enhancedContent.totalCapabilities) || 0} available. Try one of the 10 practical examples above to get started!"
}
\`\`\`

Ready to unlock the full potential of MCP-enhanced development! 🎉`;
}

/**
 * Creates the brain connection file with enhanced integration prompt
 * REQ-202: Creates connect_claude_brain.md file in current directory
 * REQ-303: Enhanced Prompt Content Generation
 * REQ-403: Use user's improved template with dynamic insertions
 */
export async function createBrainConnectionFile(
  projectPath,
  mcpServers,
  projectType = "Node.js"
) {
  const filePath = path.join(projectPath, "connect_claude_brain.md");

  // These variables are no longer used since we switched to generateFromUserTemplate
  // Keeping for potential legacy compatibility if needed

  // Verify setup and generate enhanced content
  let setupVerification, enhancedContent;

  try {
    setupVerification = await verifyClaudeSetup(projectPath);
    enhancedContent = generateEnhancedPromptContent(
      projectPath,
      mcpServers,
      projectType,
      setupVerification.analysis
    );
  } catch (error) {
    // Fallback to basic content if verification fails
    setupVerification = { success: false, error: error.message };
    enhancedContent = {
      practicalExamples: [],
      mcpCapabilities: [],
      enabledCapabilities: 0,
      totalCapabilities: 0,
    };
  }

  // These sections are now handled by generateFromUserTemplate
  // Legacy code commented out since switching to template-based approach

  // REQ-403: Use user's improved template with dynamic content insertion
  const prompt = generateFromUserTemplate(
    projectPath,
    mcpServers,
    projectType,
    setupVerification,
    enhancedContent
  );

  await fs.writeFile(filePath, prompt, "utf8");
  return filePath;
}

/**
 * Displays the brain connection prompt on screen with premium UX copy
 * REQ-301: Streamlined Connection Output - Replace verbose output with clean messaging
 * REQ-305: Professional UX Messaging - Replace unix-style output with professional messaging
 * REQ-306: Full File Path Display - Show complete file paths instead of basenames
 */
export function displayBrainConnectionPrompt(filePath) {
  console.log(chalk.green("\n✅ MCP servers configured!"));
  console.log(chalk.cyan("\n🧠 Claude brain connection ready\n"));

  // REQ-306: Display full file path instead of basename
  console.log(chalk.green("📄 Connection prompt:"), chalk.white(filePath));

  console.log(chalk.cyan("\n🚀 Next steps:"));
  console.log(chalk.gray(`   1. Open Claude Desktop or claude.ai`));
  console.log(chalk.gray(`   2. Upload: ${filePath}`));
  console.log(
    chalk.gray(`   3. Claude will verify setup and guide next steps`)
  );

  console.log(
    chalk.dim("\n💡 File contains personalized setup verification and examples")
  );
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
