#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Expert Mode Context
const EXPERT_CONTEXT = {
  dev_mode_trigger: `
# Dev Mode Activation

When "Dev Mode" is triggered, immediately:

1. Load expert multi-disciplinary perspective
2. Activate MCP real-time context awareness
3. Execute with focus on:
   - Working solutions over discussion
   - Quality without over-engineering
   - User value and maintainability

Response format:
[DEV MODE ACTIVE]
✓ Context loaded
✓ Executing: [task]

[Solution without preamble]
`,

  bootstrap_lovable: `
# Bootstrap Lovable 2.0: Expert Edition

## Quick Start

### Initialize
Check project state via MCP:
- Database schema (Supabase)
- Recent commits (GitHub)
- Documentation (Context7)

### Execute
Choose approach based on:
- User impact
- Technical complexity
- Maintenance burden

## MCP Commands

### Database (Supabase)
- "Check schema" - Current state
- "Run query" - Execute SQL
- "Migrate" - Apply changes

### Code (GitHub)
- "Recent commits" - Git history
- "Create branch" - New feature
- "Push changes" - Deploy

### Docs (Context7)
- "Search [library]" - Official docs
- "Best practices" - Pattern lookup
- "API reference" - Method details

## Decision Framework

Evaluate every request:
1. Does it solve a real problem?
2. What's the simplest solution?
3. How do we test it?
4. What could break?
5. How do we maintain it?
`,

  expert_principles: `
# Operating Principles

## Communication
- Answer first, explain if needed
- Show don't tell
- Code speaks louder than words

## Analysis
- Question complexity
- Suggest alternatives
- Identify risks early
- Balance ideal vs. practical

## Quality
- Simple > Clever
- Tested > Perfect
- Documented > Assumed
- Working > Theoretical

## Collaboration
- Build on ideas
- Acknowledge constraints
- Focus on progress
- Learn from patterns
`,
};

async function setupQuickstart() {
  console.log(chalk.cyan("\n🚀 Claude MCP Quickstart - Expert Edition\n"));

  const spinner = ora("Initializing setup...").start();

  try {
    // Get config path
    const configPath = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json",
    );

    // Read or create config
    let config = {};
    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(configContent);
    } catch (e) {
      config = { mcpServers: {} };
    }

    spinner.succeed("Configuration loaded");

    // Select features
    const { features } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "features",
        message: "Select MCP servers to configure:",
        choices: [
          {
            name: "Filesystem (Required)",
            value: "filesystem",
            checked: true,
            disabled: true,
          },
          {
            name: "Memory (Required)",
            value: "memory",
            checked: true,
            disabled: true,
          },
          { name: "GitHub", value: "github", checked: true },
          { name: "Supabase Database", value: "supabase", checked: true },
          { name: "Context7 Docs", value: "context7", checked: true },
          { name: "Brave Search", value: "brave", checked: false },
          { name: "Tavily AI Search", value: "tavily", checked: false },
        ],
      },
    ]);

    // Configure servers
    const servers = {};

    // Always add filesystem and memory
    servers.filesystem = {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        path.join(os.homedir(), "claude-mcp-workspace"),
      ],
    };

    servers.memory = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
    };

    // Add GitHub if selected
    if (features.includes("github")) {
      const { githubToken } = await inquirer.prompt([
        {
          type: "password",
          name: "githubToken",
          message: "GitHub Token (or press Enter to skip):",
          default: process.env.GITHUB_TOKEN || "",
        },
      ]);

      if (githubToken) {
        servers.github = {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: githubToken },
        };
      }
    }

    // Add Supabase if selected
    if (features.includes("supabase")) {
      const { supabaseAccessToken } = await inquirer.prompt([
        {
          type: "password",
          name: "supabaseAccessToken",
          message: "Supabase Access Token (from https://supabase.com/dashboard/account/tokens):",
          default: process.env.SUPABASE_ACCESS_TOKEN || "",
        },
      ]);

      if (supabaseAccessToken) {
        servers.supabase = {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase", `--access-token=${supabaseAccessToken}`],
        };
      }
    }

    // Add Context7 if selected
    if (features.includes("context7")) {
      const { context7Setup } = await inquirer.prompt([
        {
          type: "list",
          name: "context7Setup",
          message: "Context7 setup method:",
          choices: [
            {
              name: "Remote (recommended - no API key needed)",
              value: "remote",
            },
            { name: "Local (requires API key)", value: "local" },
            { name: "Skip", value: "skip" },
          ],
        },
      ]);

      if (context7Setup === "local") {
        const { apiKey } = await inquirer.prompt([
          {
            type: "password",
            name: "apiKey",
            message: "Context7 API Key:",
          },
        ]);

        if (apiKey) {
          servers.context7 = {
            command: "npx",
            args: ["-y", "@upstash/context7-mcp", "--api-key", apiKey],
          };
        }
      } else if (context7Setup === "remote") {
        console.log(chalk.yellow("\nContext7 Remote Setup:"));
        console.log("1. Open Claude Desktop");
        console.log("2. Go to Settings > Connectors > Add Custom Connector");
        console.log("3. Name: Context7");
        console.log("4. URL: https://mcp.context7.com/mcp\n");
      }
    }

    // Add Brave if selected
    if (features.includes("brave")) {
      const { braveKey } = await inquirer.prompt([
        {
          type: "password",
          name: "braveKey",
          message: "Brave Search API Key:",
        },
      ]);

      if (braveKey) {
        servers["brave-search"] = {
          command: "npx",
          args: ["-y", "@brave/brave-search-mcp-server"],
          env: { BRAVE_API_KEY: braveKey },
        };
      }
    }

    // Add Tavily if selected
    if (features.includes("tavily")) {
      const { tavilyKey } = await inquirer.prompt([
        {
          type: "password",
          name: "tavilyKey",
          message: "Tavily API Key:",
        },
      ]);

      if (tavilyKey) {
        servers["tavily-search"] = {
          command: "npx",
          args: ["-y", "tavily-mcp"],
          env: { TAVILY_API_KEY: tavilyKey },
        };
      }
    }

    // Merge configurations
    config.mcpServers = { ...config.mcpServers, ...servers };

    // Save config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    spinner.succeed("MCP servers configured");

    // Setup workspace with Lovable support
    const workspaceQuestions = await inquirer.prompt([
      {
        type: "confirm",
        name: "setupWorkspace",
        message: "Setup Lovable development workspace?",
        default: true,
      },
      {
        type: "list",
        name: "projectType",
        message: "What type of project are you building?",
        choices: [
          { name: "Lovable.dev full-stack app", value: "lovable" },
          { name: "API/Backend project", value: "api" },
          { name: "Learning/Experimentation", value: "learning" },
          { name: "Minimal setup", value: "minimal" },
        ],
        default: "lovable",
        when: (answers) => answers.setupWorkspace,
      },
      {
        type: "confirm",
        name: "enableAssistant",
        message: "Enable AI assistant personality? (Recommended)",
        default: true,
        when: (answers) => answers.setupWorkspace,
      },
    ]);

    if (workspaceQuestions.setupWorkspace) {
      const { projectType, enableAssistant } = workspaceQuestions;
      const contextSpinner = ora("Setting up Lovable workspace...").start();

      const workspacePath = path.join(os.homedir(), "claude-mcp-workspace");
      await fs.mkdir(workspacePath, { recursive: true });

      // Create enhanced workspace structure
      const directories = [
        "lovable-framework",
        "skippy-context", 
        "project-templates",
        "active-projects",
        "usage-guides"
      ];

      for (const dir of directories) {
        await fs.mkdir(path.join(workspacePath, dir), { recursive: true });
      }

      contextSpinner.text = "Copying Bootstrap Lovable v2 framework...";
      
      // Copy entire bootstrap-lovable-v2 directory to workspace
      const bootstrapSource = path.join(process.cwd(), "bootstrap-lovable-v2");
      const bootstrapDest = path.join(workspacePath, "lovable-framework");
      
      try {
        // Copy all bootstrap-lovable-v2 files recursively
        await copyDirectory(bootstrapSource, bootstrapDest);
      } catch (error) {
        console.warn(chalk.yellow("Bootstrap Lovable v2 not found in current directory - creating basic structure"));
      }

      contextSpinner.text = "Creating AI assistant context files...";

      if (enableAssistant) {
        // Create AI activation file
        await createAIActivation(workspacePath);
        await createLovablePatterns(workspacePath);
        await createPromptLibrary(workspacePath);
      } else {
        // Create basic dev mode
        await fs.writeFile(
          path.join(workspacePath, "DEV_MODE.md"),
          EXPERT_CONTEXT.dev_mode_trigger,
        );
      }

      contextSpinner.text = "Creating project templates...";
      await createProjectTemplates(workspacePath, projectType);

      contextSpinner.text = "Creating usage guides...";
      await createUsageGuides(workspacePath, projectType, enableAssistant);

      // Create master context based on project type
      await createMasterContext(workspacePath, projectType, enableAssistant);

      contextSpinner.succeed(`${projectType === 'lovable' ? 'Lovable' : 'Development'} workspace configured with ${enableAssistant ? 'AI assistant' : 'basic mode'}`);
    }

    console.log(chalk.green("\n✅ Setup complete!\n"));
    console.log(chalk.yellow("Next steps:"));
    console.log("1. Restart Claude Desktop");
    console.log('2. Say "Dev Mode" to activate');
    console.log("3. Start building\n");
  } catch (error) {
    spinner.fail("Setup failed");
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Workspace creation helpers
async function copyDirectory(src, dest) {
  try {
    await fs.access(src);
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    await fs.mkdir(dest, { recursive: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    throw new Error(`Failed to copy directory: ${error.message}`);
  }
}

async function readTemplate(templateName) {
  const templatePath = path.join(process.cwd(), "templates", templateName);
  
  try {
    await fs.access(templatePath);
    return await fs.readFile(templatePath, "utf8");
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Template file missing: ${templatePath}. Please ensure templates directory is present.`);
    }
    throw new Error(`Failed to read template ${templateName}: ${error.message}`);
  }
}

async function createAIActivation(workspacePath) {
  await fs.mkdir(path.join(workspacePath, "ai-context"), { recursive: true });
  const template = await readTemplate("ai-activation.md");
  await fs.writeFile(
    path.join(workspacePath, "ai-context", "AI_ACTIVATION.md"),
    template
  );
}

async function createLovablePatterns(workspacePath) {
  const template = await readTemplate("lovable-patterns.md");
  await fs.writeFile(
    path.join(workspacePath, "ai-context", "LOVABLE_PATTERNS.md"),
    template
  );
}


async function createPromptLibrary(workspacePath) {
  const template = await readTemplate("prompt-library.md");
  await fs.writeFile(
    path.join(workspacePath, "ai-context", "PROMPT_LIBRARY.md"),
    template
  );
}

async function createProjectTemplates(workspacePath, projectType) {
  await fs.mkdir(path.join(workspacePath, "project-templates"), { recursive: true });
  
  const template = await readTemplate(`project-templates/${projectType}-template.md`);
  await fs.writeFile(
    path.join(workspacePath, "project-templates", `${projectType}-template.md`),
    template
  );
}

async function createUsageGuides(workspacePath, projectType, enableAssistant) {
  const template = await readTemplate("usage-guide.md");
  await fs.writeFile(
    path.join(workspacePath, "USAGE_GUIDE.md"),
    template
  );
}

async function createMasterContext(workspacePath, projectType, enableAssistant) {
  const contextContent = enableAssistant ? 
    `# AI Assistant Lovable Development Context

## 🎯 Development Environment
- **AI Personality**: Expert Assistant (Brilliant + Supportive)
- **Platform**: Lovable.dev (React + Tailwind + Supabase)
- **Project Type**: ${projectType === 'lovable' ? 'Full-Stack Application' : 'Custom Development'}
- **MCP Integration**: Full access to Supabase, GitHub, Context7, Tavily

Type **"Dev Mode"** followed by your request.

## 🚀 Quick Commands

### Analysis Commands:
- "Analyze my Lovable app"
- "Review my Supabase schema"  
- "Check my component architecture"

### Development Commands:
- "Dev Mode: create [feature] with Lovable patterns"
- "Dev Mode: optimize performance"
- "Dev Mode: add [specific functionality]"

### Performance Commands:
- "Optimize my database queries"
- "Review my bundle size"

AI assistant automatically:
1. **Loads Development Context**: Project structure, database schema, recent commits
2. **Activates MCP Tools**: Full Supabase + GitHub + documentation access
3. **Applies Lovable Patterns**: Proven architectural approaches
4. **Provides Expert Guidance**: Technical solutions with clear explanations

## 📁 Workspace Structure

\`\`\`
claude-mcp-workspace/
├── ai-context/           # AI assistant activation & patterns
├── project-templates/    # Project-specific commands
├── USAGE_GUIDE.md       # Complete development guide
└── CONTEXT.md           # This file
\`\`\`

## 🎮 AI Assistant Modes

**Research Mode**: Deep analysis and recommendations
**Development Mode**: Feature implementation with patterns  
**Optimization Mode**: Performance and architecture improvements
**Learning Mode**: Teaching concepts and best practices

**AI Promise**: *"I'll make your Lovable development journey brilliant, efficient, and genuinely fun. We're going to build something incredible together!"* 🚀` 
    : `# Basic Development Context

## 🎯 Development Setup
- **Platform**: ${projectType === 'lovable' ? 'Lovable.dev' : 'Standard Development'}
- **MCP Integration**: Basic access to development tools

## 📁 Workspace Structure

\`\`\`
claude-mcp-workspace/
├── project-templates/    # Basic templates
├── USAGE_GUIDE.md       # Development guide
└── CONTEXT.md           # This file
\`\`\`

Ready for development assistance.`;

  await fs.writeFile(
    path.join(workspacePath, "CONTEXT.md"),
    contextContent
  );
}

export function generateServerConfig(serverType, options = {}) {
  const {
    workspacePath,
    githubToken,
    supabaseKey,
    context7ApiKey,
    braveKey,
    tavilyKey,
  } = options;

  const configs = {
    filesystem: {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        workspacePath || path.join(os.homedir(), "claude-mcp-workspace"),
      ],
    },
    memory: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
    },
    github: githubToken
      ? {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: githubToken },
        }
      : null,
    supabase: supabaseKey
      ? {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase", `--access-token=${supabaseKey}`],
        }
      : null,
    context7: context7ApiKey
      ? {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp", "--api-key", context7ApiKey],
        }
      : null,
    brave: braveKey
      ? {
          command: "npx",
          args: ["-y", "@brave/brave-search-mcp-server"],
          env: { BRAVE_API_KEY: braveKey },
        }
      : null,
    tavily: tavilyKey
      ? {
          command: "npx",
          args: ["-y", "tavily-mcp"],
          env: { TAVILY_API_KEY: tavilyKey },
        }
      : null,
  };

  return configs[serverType];
}

export function getConfigPath() {
  return path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json",
  );
}

export function getWorkspacePath() {
  return path.join(os.homedir(), "claude-mcp-workspace");
}

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupQuickstart();
}

export default setupQuickstart;
