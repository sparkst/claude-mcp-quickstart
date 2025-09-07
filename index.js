#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import commands
import setupQuickstart from './setup.js';
import activateDevMode from './dev-mode.js';

// ASCII banner
console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                  Claude MCP Quickstart                     ║
║                    Expert Edition v2.0                     ║
╚═══════════════════════════════════════════════════════════╝
`));

program
  .name('claude-mcp-quickstart')
  .description('MCP configuration with expert multi-disciplinary assistance')
  .version('2.0.0');

program
  .command('setup')
  .description('Configure MCP servers and workspace')
  .action(async () => {
    await setupQuickstart();
  });

program
  .command('dev-mode')
  .description('Activate expert development mode')
  .action(async () => {
    await activateDevMode();
  });

program
  .command('add-supabase')
  .description('Add Supabase MCP server')
  .action(async () => {
    console.log(chalk.cyan('\n🗄️ Adding Supabase\n'));
    
    const { default: inquirer } = await import('inquirer');
    
    const configPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );
    
    let config = {};
    try {
      config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    } catch {
      config = { mcpServers: {} };
    }
    
    const { url, key } = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Supabase URL:',
        validate: input => input.includes('supabase.co') || 'Invalid URL'
      },
      {
        type: 'password',
        name: 'key',
        message: 'Supabase Anon Key:'
      }
    ]);
    
    config.mcpServers.supabase = {
      command: "npx",
      args: ["-y", "@supabase/mcp-server"],
      env: {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: key
      }
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('✅ Supabase configured\n'));
  });

program
  .command('add-context7')
  .description('Add Context7 documentation search')
  .action(async () => {
    console.log(chalk.cyan('\n📚 Adding Context7\n'));
    
    const configPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );
    
    let config = {};
    try {
      config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    } catch {
      config = { mcpServers: {} };
    }
    
    config.mcpServers.context7 = {
      command: "npx",
      args: ["-y", "@context7/mcp-server"]
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Add instructions
    const workspacePath = path.join(os.homedir(), 'claude-mcp-workspace');
    await fs.mkdir(workspacePath, { recursive: true });
    
    await fs.writeFile(
      path.join(workspacePath, 'CONTEXT7.md'),
      `# Context7 Documentation Search

## Usage
When asking about libraries or frameworks, Context7 automatically:
1. Resolves the library ID
2. Fetches official documentation
3. Provides accurate, up-to-date answers

## Examples
- "How do I use React hooks?"
- "Explain Supabase auth"
- "Next.js routing best practices"

## Common Libraries
- React: /facebook/react
- Vue: /vuejs/core
- Next.js: /vercel/next.js
- Supabase: /supabase/supabase
- Node.js: /nodejs/node
`
    );
    
    console.log(chalk.green('✅ Context7 configured\n'));
  });

program
  .command('verify')
  .description('Verify MCP configuration')
  .action(async () => {
    console.log(chalk.cyan('\n🔍 Verifying Configuration\n'));
    
    const configPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );
    
    try {
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const servers = Object.keys(config.mcpServers || {});
      
      console.log(chalk.yellow('MCP Servers:'));
      const required = ['filesystem', 'memory'];
      const optional = ['github', 'supabase', 'context7', 'brave-search', 'tavily-search'];
      
      [...required, ...optional].forEach(server => {
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
      const workspacePath = path.join(os.homedir(), 'claude-mcp-workspace');
      console.log(chalk.yellow('\nWorkspace:'));
      
      try {
        await fs.access(workspacePath);
        console.log(chalk.green(`  ✓ ${workspacePath}`));
        
        // Check context files
        const contextFiles = ['DEV_MODE.md', 'BOOTSTRAP_LOVABLE.md', 'PRINCIPLES.md'];
        console.log(chalk.yellow('\nContext Files:'));
        
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
      
      console.log(chalk.cyan('\n✅ Verification complete\n'));
      
    } catch (error) {
      console.error(chalk.red('Verification failed:'), error.message);
    }
  });

program
  .command('quick-start')
  .description('Complete setup with all features')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🚀 Quick Start\n'));
    
    console.log(chalk.yellow('Step 1: Setup MCP servers...'));
    await setupQuickstart();
    
    console.log(chalk.yellow('\nStep 2: Activating Dev Mode...'));
    await activateDevMode();
    
    console.log(chalk.green.bold('\n🎉 Setup Complete!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log('1. Restart Claude Desktop');
    console.log('2. Say "Dev Mode" to activate');
    console.log('3. Start building!\n');
  });

program.parse();
