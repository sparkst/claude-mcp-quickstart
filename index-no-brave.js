#!/usr/bin/env node

/**
 * MCP Quickstart - NPM Package (No Brave Search Version)
 * Simplified to only essential servers
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class MCPInstaller {
  constructor() {
    this.platform = os.platform();
    this.homeDir = os.homedir();
    this.mpcDir = path.join(this.homeDir, '.mcp-servers');
    this.workspace = path.join(this.homeDir, 'claude-mcp-workspace');
    
    // Claude config path by platform
    this.claudeConfig = this.platform === 'darwin'
      ? path.join(this.homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
      : this.platform === 'win32'
      ? path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json')
      : path.join(this.homeDir, '.config', 'claude', 'claude_desktop_config.json');
    
    // Only truly essential servers (no API keys needed)
    this.servers = [
      '@modelcontextprotocol/server-filesystem',
      '@modelcontextprotocol/server-memory'
    ];
    
    // Optional server if GitHub token exists
    if (process.env.GITHUB_TOKEN) {
      this.servers.push('@modelcontextprotocol/server-github');
    }
    
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: '→'
    }[type] || '';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') {
      this.errors.push(message);
    }
  }

  execCommand(command) {
    try {
      return execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
    } catch (error) {
      return null;
    }
  }

  checkNode() {
    const nodeVersion = this.execCommand('node --version');
    if (!nodeVersion) {
      this.log('Node.js is required. Install from https://nodejs.org', 'error');
      return false;
    }
    this.log(`Node.js ${nodeVersion} detected`, 'success');
    return true;
  }

  backupConfig() {
    if (fs.existsSync(this.claudeConfig)) {
      const backup = `${this.claudeConfig}.backup.${Date.now()}`;
      fs.copyFileSync(this.claudeConfig, backup);
      this.log(`Backed up existing config`, 'info');
    }
  }

  createDirectories() {
    [this.mpcDir, this.workspace, path.dirname(this.claudeConfig)].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    this.log('Created directories', 'success');
  }

  installServers() {
    this.log('Installing MCP servers (no API keys required)...', 'info');
    
    process.chdir(this.mpcDir);
    
    if (!fs.existsSync('package.json')) {
      this.execCommand('npm init -y');
    }
    
    let installed = 0;
    this.servers.forEach(server => {
      const name = server.split('/').pop();
      process.stdout.write(`  Installing ${name}...`);
      
      const result = this.execCommand(`npm install ${server} --silent`);
      if (result !== null || fs.existsSync(path.join('node_modules', server))) {
        console.log(' ✓');
        installed++;
      } else {
        console.log(' ✗');
        this.log(`Failed to install ${name}`, 'warning');
      }
    });
    
    this.log(`Installed ${installed}/${this.servers.length} servers`, installed > 0 ? 'success' : 'error');
    return installed > 0;
  }

  generateConfig() {
    const config = {
      mcpServers: {
        filesystem: {
          command: 'node',
          args: [
            path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol', 'server-filesystem', 'dist', 'index.js'),
            this.workspace
          ]
        },
        memory: {
          command: 'node',
          args: [
            path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol', 'server-memory', 'dist', 'index.js')
          ]
        }
      }
    };
    
    // Only add GitHub if token exists
    if (process.env.GITHUB_TOKEN) {
      config.mcpServers.github = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN
        }
      };
      this.log('GitHub token detected - adding GitHub server', 'success');
    }
    
    fs.writeFileSync(this.claudeConfig, JSON.stringify(config, null, 2));
    this.log('Generated Claude configuration', 'success');
  }

  createTestFile() {
    const testFile = path.join(this.workspace, 'test-mcp.md');
    fs.writeFileSync(testFile, `# MCP Test Commands

Run these in Claude to verify your setup:

1. **Filesystem Test**
   \`\`\`
   List all files in my workspace
   \`\`\`

2. **Memory Test**
   \`\`\`
   Remember this: "MCP setup completed on ${new Date().toLocaleDateString()}"
   \`\`\`

3. **Create Something**
   \`\`\`
   Create a Python script that prints "Hello MCP"
   \`\`\`

If these work, your MCP setup is complete!

Note: Web search not included (requires Brave API key).
To add GitHub support, set GITHUB_TOKEN environment variable and run again.
`);
    this.log('Created test file', 'success');
  }

  verify() {
    console.log('\n🔍 Verifying installation...\n');
    
    let checks = 0;
    let passed = 0;
    
    const check = (name, condition) => {
      checks++;
      if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
        return true;
      } else {
        console.log(`  ❌ ${name}`);
        return false;
      }
    };
    
    check('Node.js installed', this.execCommand('node --version'));
    check('MCP directory exists', fs.existsSync(this.mpcDir));
    check('Workspace exists', fs.existsSync(this.workspace));
    check('Claude config exists', fs.existsSync(this.claudeConfig));
    
    // Only check for servers we attempted to install
    check('Filesystem server', fs.existsSync(path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol/server-filesystem')));
    check('Memory server', fs.existsSync(path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol/server-memory')));
    
    if (process.env.GITHUB_TOKEN) {
      check('GitHub server', fs.existsSync(path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol/server-github')));
    }
    
    const percentage = Math.round((passed / checks) * 100);
    console.log(`\n📊 Result: ${passed}/${checks} checks passed (${percentage}%)\n`);
    
    return percentage === 100;
  }

  async run() {
    console.log(`
╔════════════════════════════════════════╗
║     MCP Quickstart (Simplified)        ║
║         No API Keys Required           ║
╚════════════════════════════════════════╝
`);
    
    if (!this.checkNode()) {
      process.exit(1);
    }
    
    this.backupConfig();
    this.createDirectories();
    
    if (!this.installServers()) {
      this.log('Server installation failed', 'error');
      process.exit(1);
    }
    
    this.generateConfig();
    this.createTestFile();
    
    const success = this.verify();
    
    if (success) {
      console.log(`
✅ Setup Complete!

Installed:
• Filesystem - Read/write files in workspace
• Memory - Persistent memory across chats
${process.env.GITHUB_TOKEN ? '• GitHub - Repository management' : ''}

NOT installed (requires API keys):
${!process.env.GITHUB_TOKEN ? '• GitHub - Set GITHUB_TOKEN env variable' : ''}
• Web Search - Requires Brave API key

Next steps:
1. Restart Claude Desktop
2. Test: "Show me my MCP capabilities"

Workspace: ${this.workspace}
`);
    } else {
      console.log(`
⚠️  Setup partially complete.
Check errors above.
`);
    }
    
    process.exit(this.errors.length > 0 ? 1 : 0);
  }
}

if (require.main === module) {
  const installer = new MCPInstaller();
  installer.run();
}

module.exports = MCPInstaller;
