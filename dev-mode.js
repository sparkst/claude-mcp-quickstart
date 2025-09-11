#!/usr/bin/env node

import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import os from "os";

async function getConfigPath() {
  const platform = os.platform();
  const homedir = os.homedir();

  switch (platform) {
    case "win32":
      return path.join(
        homedir,
        "AppData",
        "Roaming",
        "Claude",
        "claude_desktop_config.json"
      );
    case "darwin":
      return path.join(
        homedir,
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      );
    default:
      return path.join(
        homedir,
        ".config",
        "claude-desktop",
        "claude_desktop_config.json"
      );
  }
}

const PROJECT_TYPE_DETECTORS = [
  { check: (pkg, deps) => deps.react || deps["@types/react"], type: "React" },
  { check: (pkg, deps) => deps.next, type: "Next.js" },
  { check: (pkg, deps) => deps.vue, type: "Vue.js" },
  { check: (pkg, deps) => deps.svelte, type: "Svelte" },
  {
    check: (pkg, deps) => deps.express || deps.fastify || deps.koa,
    type: "Node.js API",
  },
  {
    check: (pkg, deps) => pkg.type === "module" || deps.vitest,
    type: "Node.js (ESM)",
  },
];

const FILE_TYPE_DETECTORS = [
  { file: "Cargo.toml", type: "Rust" },
  { file: "pyproject.toml", type: "Python" },
  { file: "go.mod", type: "Go" },
];

async function detectProjectType(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const detector of PROJECT_TYPE_DETECTORS) {
      if (detector.check(packageJson, deps)) {
        return detector.type;
      }
    }

    return "Node.js";
  } catch {
    for (const detector of FILE_TYPE_DETECTORS) {
      try {
        await fs.access(path.join(projectPath, detector.file));
        return detector.type;
      } catch {
        // File doesn't exist, continue to next detector
      }
    }

    return "General";
  }
}

async function getMCPServerInfo(configPath) {
  try {
    const configContent = await fs.readFile(configPath, "utf-8");
    if (configContent.length > 1024 * 1024) {
      throw new Error("Config file too large");
    }

    const config = JSON.parse(configContent);
    const servers = config.mcpServers || {};

    const serverDescriptions = {
      memory:
        "Save and recall project context, decisions, and important information",
      "brave-search":
        "Search the web for current information and documentation",
      context7:
        "Look up documentation for libraries and frameworks (deprecated - use Claude Settings → Extensions)",
      tavily: "Research and analyze topics with AI-powered search",
      supabase: "Interact with Supabase databases and APIs",
      github:
        "GitHub integration (deprecated - use Claude Settings → Connectors → GitHub)",
      filesystem:
        "File system access (deprecated - use Claude Settings → Extensions → Filesystem)",
    };

    return Object.keys(servers).map((name) => ({
      name,
      description: serverDescriptions[name] || "Custom MCP server",
    }));
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Could not read MCP config: ${error.message}`)
    );
    return [];
  }
}

function validateProjectPath(projectPath) {
  if (!projectPath || typeof projectPath !== "string") {
    throw new Error("Invalid project path");
  }

  const resolvedPath = path.resolve(projectPath);
  const normalizedPath = path.normalize(resolvedPath);

  if (normalizedPath.includes("..")) {
    throw new Error("Path traversal not allowed");
  }

  return normalizedPath;
}

function generateContextContent(
  projectPath,
  projectType,
  configPath,
  mcpServers,
  directoryStructure
) {
  return `# Claude MCP Workspace Context

## Project Information
- **Path**: ${projectPath}
- **Type**: ${projectType}
- **MCP Config**: ${configPath}
- **Setup Date**: ${new Date().toISOString()}

## Available MCP Tools
${mcpServers.map((server) => `- **${server.name}**: ${server.description}`).join("\n")}

## Key Directories
${directoryStructure}

## Development Patterns
- This is a ${projectType} project with MCP integration
- Claude has access to enhanced capabilities via MCP servers
- Use memory MCP to persist important project context
- Use search MCPs for research and documentation lookup

## Quick Commands
- "Save this to memory: [important info]"
- "Search for documentation on [topic]"
- "Help me understand this project structure"
- "Research best practices for [technology]"
`;
}

function generateIntegrationPrompt(
  projectPath,
  projectType,
  configPath,
  mcpServers
) {
  return `# 🚀 Claude MCP Workspace Setup Complete!

Hi Claude! I've set up an MCP-enabled workspace for development. Here's everything you need to know:

## 📁 Workspace Context
- **Project Directory**: \`${projectPath}\`
- **Project Type**: ${projectType}
- **MCP Configuration**: \`${configPath}\`

## 🛠️ Available MCP Tools
${mcpServers.map((server) => `- **${server.name}**: ${server.description}`).join("\n")}

${mcpServers.length === 0 ? "\n⚠️  **No MCP servers detected**. Run `claude-mcp-quickstart setup` to configure MCP servers." : ""}

## 🧠 Please Save This Context
Use your memory to save:
\`\`\`
Primary workspace: ${projectPath}
Project type: ${projectType}
Available MCP tools: ${mcpServers.map((s) => s.name).join(", ")}
Context file: .claude-context (in project root)
\`\`\`

## 🚀 Ready to Develop!
You can now help me with:
- **Code analysis**: "Analyze the structure of this ${projectType} project"
- **Research**: "Find best practices for ${projectType} development"
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
"Search for ${projectType} best practices"
"Help me explore this codebase"
\`\`\`

Ready to build something amazing together! 🎉`;
}

async function writeContextFiles(
  projectPath,
  contextContent,
  integrationPrompt
) {
  const contextPath = path.join(projectPath, ".claude-context");
  const promptPath = path.join(projectPath, ".claude-integration.md");

  await fs.writeFile(contextPath, contextContent);
  await fs.writeFile(promptPath, integrationPrompt);

  return { promptPath, contextPath };
}

function displayResults(integrationPrompt) {
  console.log(chalk.green("✅ Generated workspace context files:"));
  console.log(chalk.gray(`   📄 .claude-context`));
  console.log(chalk.gray(`   📄 .claude-integration.md`));

  console.log(chalk.cyan("\n📋 Next Steps:"));
  console.log(
    chalk.yellow("1. Copy the content below and paste it into Claude:")
  );
  console.log(chalk.gray("─".repeat(60)));
  console.log(integrationPrompt);
  console.log(chalk.gray("─".repeat(60)));

  console.log(chalk.cyan("\n💡 Pro Tips:"));
  console.log(
    chalk.gray("• Ask Claude to save the workspace context to memory")
  );
  console.log(
    chalk.gray(
      "• Use 'claude-mcp-quickstart dev-mode' anytime to regenerate this prompt"
    )
  );
  console.log(
    chalk.gray(
      "• The .claude-context file contains project details for reference"
    )
  );
}

async function generateClaudeIntegration() {
  console.log(chalk.cyan("\n🚀 Generating Claude Integration Prompt\n"));

  try {
    const projectPath = validateProjectPath(process.cwd());
    const configPath = await getConfigPath();
    const projectType = await detectProjectType(projectPath);
    const mcpServers = await getMCPServerInfo(configPath);
    const directoryStructure = await generateDirectoryStructure(projectPath);

    const contextContent = generateContextContent(
      projectPath,
      projectType,
      configPath,
      mcpServers,
      directoryStructure
    );
    const integrationPrompt = generateIntegrationPrompt(
      projectPath,
      projectType,
      configPath,
      mcpServers
    );

    const { promptPath, contextPath } = await writeContextFiles(
      projectPath,
      contextContent,
      integrationPrompt
    );

    displayResults(integrationPrompt);

    return { promptPath, contextPath };
  } catch (error) {
    console.error(
      chalk.red("Error generating Claude integration:"),
      error.message
    );
    throw error;
  }
}

async function generateDirectoryStructure(projectPath) {
  try {
    const validatedPath = validateProjectPath(projectPath);
    const items = await fs.readdir(validatedPath, { withFileTypes: true });
    const dirs = items
      .filter(
        (item) =>
          item.isDirectory() &&
          !item.name.startsWith(".") &&
          item.name !== "node_modules"
      )
      .slice(0, 10)
      .map((dir) => `- \`${dir.name}/\``)
      .join("\n");

    return dirs || "- Project files in root directory";
  } catch (error) {
    console.warn(
      chalk.yellow(
        `Warning: Could not read directory structure: ${error.message}`
      )
    );
    return "- Unable to read directory structure";
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateClaudeIntegration().catch((error) => {
    console.error(
      chalk.red("Error generating Claude integration:"),
      error.message
    );
    process.exit(1);
  });
}

export default generateClaudeIntegration;
