#!/usr/bin/env node

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
    
    this.servers = [
      '@modelcontextprotocol/server-filesystem',
      '@modelcontextprotocol/server-memory'
    ];
    
    // Add GitHub if token exists
    if (process.env.GITHUB_TOKEN) {
      this.servers.push('@modelcontextprotocol/server-github');
    }
  }

  log(message, type = 'info') {
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: '→'
    }[type] || '';
    
    console.log(`${prefix} ${message}`);
  }

  execCommand(command) {
    try {
      return execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
    } catch {
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
      this.log('Backed up existing config', 'info');
    }
  }

  createDirectories() {
    [this.mpcDir, this.workspace, path.dirname(this.claudeConfig)].forEach(dir => {
      fs.mkdirSync(dir, { recursive: true });
    });
    this.log('Created directories', 'success');
  }

  installServers() {
    this.log('Installing MCP servers...', 'info');
    
    const originalDir = process.cwd();
    process.chdir(this.mpcDir);
    
    try {
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
        }
      });
      
      this.log(`Installed ${installed}/${this.servers.length} servers`, 'success');
      return installed > 0;
    } finally {
      process.chdir(originalDir);
    }
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
    
    if (process.env.GITHUB_TOKEN) {
      config.mcpServers.github = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN
        }
      };
    }
    
    fs.writeFileSync(this.claudeConfig, JSON.stringify(config, null, 2));
    this.log('Generated Claude configuration', 'success');
  }

  createTestFile() {
    const testFile = path.join(this.workspace, 'test-mcp.md');
    fs.writeFileSync(testFile, `# MCP Test Commands

Run these in Claude:

1. List all files in my workspace
2. Create a file called hello.py
3. Remember: "Setup complete"

Your workspace: ${this.workspace}
`);
  }

  verify() {
    console.log('\n🔍 Verifying installation...\n');
    
    const checks = [
      ['Node.js', () => this.execCommand('node --version')],
      ['MCP directory', () => fs.existsSync(this.mpcDir)],
      ['Workspace', () => fs.existsSync(this.workspace)],
      ['Claude config', () => fs.existsSync(this.claudeConfig)],
      ['Filesystem server', () => fs.existsSync(path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol/server-filesystem'))],
      ['Memory server', () => fs.existsSync(path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol/server-memory'))]
    ];
    
    if (process.env.GITHUB_TOKEN) {
      checks.push(['GitHub server', () => fs.existsSync(path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol/server-github'))]);
    }
    
    let passed = 0;
    checks.forEach(([name, check]) => {
      if (check()) {
        console.log(`  ✅ ${name}`);
        passed++;
      } else {
        console.log(`  ❌ ${name}`);
      }
    });
    
    const percentage = Math.round((passed / checks.length) * 100);
    console.log(`\n📊 Result: ${passed}/${checks.length} checks passed (${percentage}%)\n`);
    
    return percentage === 100;
  }

  run() {
    console.log(`
╔════════════════════════════════════════╗
║         MCP Quickstart v1.0.0          ║
╚════════════════════════════════════════╝
`);
    
    if (!this.checkNode()) {
      process.exit(1);
    }
    
    this.backupConfig();
    this.createDirectories();
    
    if (!this.installServers()) {
      this.log('Installation failed', 'error');
      process.exit(1);
    }
    
    this.generateConfig();
    this.createTestFile();
    
    const success = this.verify();
    
    console.log(success ? `
✅ Setup Complete!

Next steps:
1. Restart Claude Desktop
2. Test: "Show me my MCP capabilities"

Workspace: ${this.workspace}
` : `
⚠️  Setup incomplete. Check errors above.
`);
    
    process.exit(success ? 0 : 1);
  }
}

if (require.main === module) {
  const command = process.argv[2];
  const installer = new MCPInstaller();
  
  if (command === 'verify') {
    installer.verify();
  } else {
    installer.run();
  }
}

module.exports = MCPInstaller;
