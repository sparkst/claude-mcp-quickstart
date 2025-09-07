#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Expert Mode Context - Professional multi-disciplinary approach
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
- Database schema
- Recent commits
- Existing patterns

### Execute
Choose approach based on:
- User impact
- Technical complexity
- Maintenance burden

## MCP Commands

### Database
- "Check schema" - Current state
- "Analyze tables" - Find issues
- "Migrate [change]" - Apply updates

### Code
- "Recent commits" - Git history
- "Create branch" - New feature
- "Push changes" - Deploy

### Documentation
- "Search [library]" - Context7 docs
- "Best practices" - Pattern lookup

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
`
};

async function setupQuickstart() {
  console.log(chalk.cyan('\n🚀 Claude MCP Quickstart - Expert Edition\n'));
  
  const spinner = ora('Initializing setup...').start();
  
  try {
    // Get config path
    const configPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );
    
    // Read or create config
    let config = {};
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch (e) {
      config = { mcpServers: {} };
    }
    
    spinner.succeed('Configuration loaded');
    
    // Select features
    const { features } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select MCP servers to configure:',
        choices: [
          { name: 'Filesystem (Required)', value: 'filesystem', checked: true, disabled: true },
          { name: 'Memory (Required)', value: 'memory', checked: true, disabled: true },
          { name: 'GitHub', value: 'github', checked: true },
          { name: 'Supabase', value: 'supabase', checked: true },
          { name: 'Context7 Docs', value: 'context7', checked: true },
          { name: 'Web Search (Brave)', value: 'brave', checked: false },
          { name: 'AI Search (Tavily)', value: 'tavily', checked: false }
        ]
      }
    ]);
    
    // Configure servers
    const servers = {};
    
    // Always add filesystem and memory
    servers.filesystem = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", path.join(os.homedir(), "claude-mcp-workspace")]
    };
    
    servers.memory = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"]
    };
    
    // Add GitHub if selected
    if (features.includes('github')) {
      const { githubToken } = await inquirer.prompt([
        {
          type: 'password',
          name: 'githubToken',
          message: 'GitHub Token (or press Enter to skip):',
          default: process.env.GITHUB_TOKEN || ''
        }
      ]);
      
      if (githubToken) {
        servers.github = {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: githubToken }
        };
      }
    }
    
    // Add Supabase if selected
    if (features.includes('supabase')) {
      const { supabaseUrl, supabaseKey } = await inquirer.prompt([
        {
          type: 'input',
          name: 'supabaseUrl',
          message: 'Supabase URL (or press Enter to skip):',
          default: process.env.SUPABASE_URL || ''
        },
        {
          type: 'password',
          name: 'supabaseKey',
          message: 'Supabase Anon Key (or press Enter to skip):',
          default: process.env.SUPABASE_ANON_KEY || '',
          when: (answers) => answers.supabaseUrl
        }
      ]);
      
      if (supabaseUrl && supabaseKey) {
        servers.supabase = {
          command: "npx",
          args: ["-y", "@supabase/mcp-server"],
          env: {
            SUPABASE_URL: supabaseUrl,
            SUPABASE_ANON_KEY: supabaseKey
          }
        };
      }
    }
    
    // Add Context7 if selected
    if (features.includes('context7')) {
      servers.context7 = {
        command: "npx",
        args: ["-y", "@context7/mcp-server"]
      };
    }
    
    // Add search tools if selected
    if (features.includes('brave')) {
      const { braveKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'braveKey',
          message: 'Brave Search API Key (or press Enter to skip):'
        }
      ]);
      
      if (braveKey) {
        servers['brave-search'] = {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-brave-search"],
          env: { BRAVE_API_KEY: braveKey }
        };
      }
    }
    
    if (features.includes('tavily')) {
      const { tavilyKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'tavilyKey',
          message: 'Tavily API Key (or press Enter to skip):'
        }
      ]);
      
      if (tavilyKey) {
        servers['tavily-search'] = {
          command: "npx",
          args: ["-y", "@keats/mcp-server-tavily"],
          env: { TAVILY_API_KEY: tavilyKey }
        };
      }
    }
    
    // Merge configurations
    config.mcpServers = { ...config.mcpServers, ...servers };
    
    // Save config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    spinner.succeed('MCP servers configured');
    
    // Setup workspace
    const { setupWorkspace } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupWorkspace',
        message: 'Setup expert mode context?',
        default: true
      }
    ]);
    
    if (setupWorkspace) {
      const contextSpinner = ora('Setting up workspace...').start();
      
      const workspacePath = path.join(os.homedir(), 'claude-mcp-workspace');
      await fs.mkdir(workspacePath, { recursive: true });
      
      // Create context files
      await fs.writeFile(
        path.join(workspacePath, 'DEV_MODE.md'),
        EXPERT_CONTEXT.dev_mode_trigger
      );
      
      await fs.writeFile(
        path.join(workspacePath, 'BOOTSTRAP_LOVABLE.md'),
        EXPERT_CONTEXT.bootstrap_lovable
      );
      
      await fs.writeFile(
        path.join(workspacePath, 'PRINCIPLES.md'),
        EXPERT_CONTEXT.expert_principles
      );
      
      // Create master context
      await fs.writeFile(
        path.join(workspacePath, 'CONTEXT.md'),
        `# Expert Mode Context

${EXPERT_CONTEXT.dev_mode_trigger}
${EXPERT_CONTEXT.bootstrap_lovable}
${EXPERT_CONTEXT.expert_principles}

## Quick Commands

- "Dev Mode" - Activate expert mode
- "Check setup" - Verify configuration
- "Ship it" - Deploy checklist
- "Analyze" - Deep investigation

## Workspace: ${workspacePath}
`
      );
      
      contextSpinner.succeed('Workspace configured');
    }
    
    console.log(chalk.green('\n✅ Setup complete!\n'));
    console.log(chalk.yellow('Next steps:'));
    console.log('1. Restart Claude Desktop');
    console.log('2. Say "Dev Mode" to activate');
    console.log('3. Start building\n');
    
  } catch (error) {
    spinner.fail('Setup failed');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupQuickstart();
}

export default setupQuickstart;
