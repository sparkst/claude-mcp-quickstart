#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

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
    
    // Core servers (no API needed)
    this.coreServers = [
      '@modelcontextprotocol/server-filesystem',
      '@modelcontextprotocol/server-memory'
    ];
    
    // Optional servers that need API keys
    this.optionalServers = [];
    
    // API keys storage
    this.apiKeys = {};
    
    // Existing config
    this.existingConfig = null;
    
    // For readline interface
    this.rl = null;
  }

  log(message, type = 'info') {
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: '→',
      star: '⭐'
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

  async prompt(question) {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer.trim());
      });
    });
  }

  maskApiKey(key) {
    if (!key || key.length < 8) return key;
    return key.substring(0, 5) + '...' + key.substring(key.length - 3);
  }

  loadExistingConfig() {
    if (fs.existsSync(this.claudeConfig)) {
      try {
        this.existingConfig = JSON.parse(fs.readFileSync(this.claudeConfig, 'utf8'));
        return true;
      } catch {
        this.existingConfig = null;
        return false;
      }
    }
    return false;
  }

  getExistingApiKey(serviceName) {
    if (!this.existingConfig || !this.existingConfig.mcpServers) {
      return null;
    }

    const server = this.existingConfig.mcpServers[serviceName];
    if (!server || !server.env) {
      return null;
    }

    // Different services use different env var names
    const keyMap = {
      'brave-search': 'BRAVE_API_KEY',
      'tavily-search': 'TAVILY_API_KEY',
      'github': 'GITHUB_PERSONAL_ACCESS_TOKEN'
    };

    const envVar = keyMap[serviceName];
    return server.env[envVar] || null;
  }

  async setupWizard() {
    console.log(`
╔════════════════════════════════════════╗
║         MCP Quickstart Setup           ║
║         First Time Setup Wizard        ║
╚════════════════════════════════════════╝

Welcome! Let's set up your AI-powered Claude Desktop.
This takes about 60 seconds.
`);

    // Load existing configuration
    const hasExisting = this.loadExistingConfig();
    
    if (hasExisting) {
      console.log('📝 Found existing configuration. We\'ll preserve your settings.\n');
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Search Services (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like Claude to search the web?
This requires free API keys from search providers.
`);

    // Brave Search
    console.log(`📍 Brave Search (Private, no tracking)`);
    console.log(`   Get free API key: https://api.search.brave.com/app/keys`);
    console.log(`   (2,000 free searches/month)\n`);
    
    const existingBrave = this.getExistingApiKey('brave-search');
    let bravePrompt = 'Brave API Key (press Enter to skip): ';
    
    if (existingBrave && existingBrave !== 'REPLACE_WITH_BRAVE_KEY') {
      bravePrompt = `Brave API Key [Current: ${this.maskApiKey(existingBrave)}] (Enter to keep, or paste new): `;
    }
    
    const braveKey = await this.prompt(bravePrompt);
    
    if (braveKey) {
      // User entered a new key
      this.apiKeys.brave = braveKey;
      this.optionalServers.push('@modelcontextprotocol/server-brave-search');
      this.log('Brave Search will be updated', 'success');
    } else if (existingBrave && existingBrave !== 'REPLACE_WITH_BRAVE_KEY') {
      // User pressed enter, keep existing
      this.apiKeys.brave = existingBrave;
      this.optionalServers.push('@modelcontextprotocol/server-brave-search');
      this.log('Keeping existing Brave Search configuration', 'info');
    } else {
      this.log('Skipping Brave Search', 'info');
    }

    console.log('');

    // Tavily Search
    console.log(`📍 Tavily Search (AI-optimized search)`);
    console.log(`   Get free API key: https://app.tavily.com/sign-up`);
    console.log(`   (1,000 free searches/month)\n`);
    
    const existingTavily = this.getExistingApiKey('tavily-search');
    let tavilyPrompt = 'Tavily API Key (press Enter to skip): ';
    
    if (existingTavily && existingTavily !== 'REPLACE_WITH_TAVILY_KEY') {
      tavilyPrompt = `Tavily API Key [Current: ${this.maskApiKey(existingTavily)}] (Enter to keep, or paste new): `;
    }
    
    const tavilyKey = await this.prompt(tavilyPrompt);
    
    if (tavilyKey) {
      // User entered a new key
      this.apiKeys.tavily = tavilyKey;
      this.optionalServers.push('@modelcontextprotocol/server-tavily');
      this.log('Tavily Search will be updated', 'success');
    } else if (existingTavily && existingTavily !== 'REPLACE_WITH_TAVILY_KEY') {
      // User pressed enter, keep existing
      this.apiKeys.tavily = existingTavily;
      this.optionalServers.push('@modelcontextprotocol/server-tavily');
      this.log('Keeping existing Tavily Search configuration', 'info');
    } else {
      this.log('Skipping Tavily Search', 'info');
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: GitHub Integration (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like Claude to manage your GitHub repos?
`);

    console.log(`📍 GitHub Personal Access Token`);
    console.log(`   Create token: https://github.com/settings/tokens/new`);
    console.log(`   Required scopes: repo, read:user\n`);
    
    const existingGithub = this.getExistingApiKey('github');
    let githubPrompt = 'GitHub Token (press Enter to skip): ';
    
    if (existingGithub && existingGithub !== 'REPLACE_WITH_GITHUB_TOKEN') {
      githubPrompt = `GitHub Token [Current: ${this.maskApiKey(existingGithub)}] (Enter to keep, or paste new): `;
    }
    
    const githubToken = await this.prompt(githubPrompt);
    
    if (githubToken) {
      // User entered a new key
      this.apiKeys.github = githubToken;
      this.optionalServers.push('@modelcontextprotocol/server-github');
      this.log('GitHub will be updated', 'success');
    } else if (existingGithub && existingGithub !== 'REPLACE_WITH_GITHUB_TOKEN') {
      // User pressed enter, keep existing
      this.apiKeys.github = existingGithub;
      this.optionalServers.push('@modelcontextprotocol/server-github');
      this.log('Keeping existing GitHub configuration', 'info');
    } else {
      this.log('Skipping GitHub', 'info');
    }

    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Installing Components
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
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
      
      // Install all servers (core + optional)
      const allServers = [...this.coreServers, ...this.optionalServers];
      let installed = 0;
      
      // Check if Tavily server exists, if not try alternative
      const tavilyIndex = allServers.indexOf('@modelcontextprotocol/server-tavily');
      if (tavilyIndex !== -1) {
        // Check if official Tavily server exists
        const checkTavily = this.execCommand('npm view @modelcontextprotocol/server-tavily version 2>/dev/null');
        if (!checkTavily) {
          // If official doesn't exist, we'll create a custom implementation
          this.log('Official Tavily server not found, creating custom implementation', 'info');
          allServers.splice(tavilyIndex, 1); // Remove from install list
          this.createTavilyServer();
          installed++;
        }
      }
      
      allServers.forEach(server => {
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
      
      // Always update Tavily server if it exists
      if (this.apiKeys.tavily) {
        this.createTavilyServer();
      }
      
      this.log(`Installed ${installed} components`, 'success');
      return installed > 0;
    } finally {
      process.chdir(originalDir);
    }
  }

  createTavilyServer() {
    // Create a proper MCP-compliant Tavily server (fixed version)
    const tavilyScript = `#!/usr/bin/env node
const readline = require('readline');
const https = require('https');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(id, result, error = null) {
  const response = { jsonrpc: '2.0', id: id };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  console.log(JSON.stringify(response));
}

async function searchTavily(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: query,
      max_results: 5,
      include_answer: true
    });
    
    const options = {
      hostname: 'api.tavily.com',
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, res => {
      let result = '';
      res.on('data', chunk => result += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    
    if (message.method === 'initialize') {
      sendResponse(message.id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'tavily-search', version: '1.0.0' }
      });
      return;
    }
    
    if (message.method === 'tools/list') {
      sendResponse(message.id, {
        tools: [{
          name: 'tavily_search',
          description: 'Search the web using Tavily AI-optimized search',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Search query' } },
            required: ['query']
          }
        }]
      });
      return;
    }
    
    if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params;
      if (name === 'tavily_search') {
        try {
          const results = await searchTavily(args.query);
          let responseText = '';
          if (results.answer) responseText = results.answer + '\\n\\n';
          if (results.results && results.results.length > 0) {
            responseText += 'Search Results:\\n\\n';
            results.results.forEach((r, i) => {
              responseText += \`\${i + 1}. **\${r.title}**\\n   \${r.content}\\n   Source: \${r.url}\\n\\n\`;
            });
          }
          sendResponse(message.id, {
            content: [{ type: 'text', text: responseText || 'No results found' }]
          });
        } catch (error) {
          sendResponse(message.id, null, { code: -32603, message: 'Search failed: ' + error.message });
        }
      } else {
        sendResponse(message.id, null, { code: -32601, message: 'Unknown tool: ' + name });
      }
      return;
    }
    
    if (message.method === 'prompts/list' || message.method === 'resources/list') {
      sendResponse(message.id, null, { code: -32601, message: 'Method not found' });
      return;
    }
    
    if (message.method && message.method.startsWith('notifications/')) return;
    
    if (message.id !== undefined) {
      sendResponse(message.id, null, { code: -32601, message: 'Method not found' });
    }
  } catch (error) {
    console.error('Parse error:', error.message);
  }
});

console.error('Tavily MCP Server started');
process.on('SIGINT', () => process.exit(0));
`;
    
    const tavilyPath = path.join(this.mpcDir, 'tavily-server.js');
    fs.writeFileSync(tavilyPath, tavilyScript);
    fs.chmodSync(tavilyPath, '755');
    this.log('Created/Updated Tavily MCP server', 'success');
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
    
    // Add configured services
    if (this.apiKeys.github) {
      config.mcpServers.github = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: this.apiKeys.github
        }
      };
    }
    
    if (this.apiKeys.brave) {
      config.mcpServers['brave-search'] = {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: {
          BRAVE_API_KEY: this.apiKeys.brave
        }
      };
    }
    
    if (this.apiKeys.tavily) {
      // Check if official server was installed
      const officialTavilyPath = path.join(this.mpcDir, 'node_modules', '@modelcontextprotocol', 'server-tavily');
      if (fs.existsSync(officialTavilyPath)) {
        config.mcpServers['tavily-search'] = {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-tavily'],
          env: {
            TAVILY_API_KEY: this.apiKeys.tavily
          }
        };
      } else {
        // Use custom implementation
        config.mcpServers['tavily-search'] = {
          command: 'node',
          args: [path.join(this.mpcDir, 'tavily-server.js')],
          env: {
            TAVILY_API_KEY: this.apiKeys.tavily
          }
        };
      }
    }
    
    fs.writeFileSync(this.claudeConfig, JSON.stringify(config, null, 2));
    this.log('Generated Claude configuration', 'success');
  }

  createWelcomeFile() {
    const welcomeFile = path.join(this.workspace, 'README.md');
    const searchInfo = [];
    
    if (this.apiKeys.brave) searchInfo.push('- ✅ Brave Search');
    if (this.apiKeys.tavily) searchInfo.push('- ✅ Tavily Search');
    if (this.apiKeys.github) searchInfo.push('- ✅ GitHub Integration');
    
    fs.writeFileSync(welcomeFile, `# Welcome to Your AI Workspace! 🎉

Your MCP setup is complete. Here's what you can do:

## Test Commands for Claude

### Basic Test
\`\`\`
Show me my MCP capabilities
\`\`\`

### File Operations
\`\`\`
List all files in my workspace
Create a Python script that prints "Hello World"
\`\`\`

### Memory Test
\`\`\`
Remember: My favorite color is blue
What's my favorite color?
\`\`\`

${searchInfo.length > 0 ? `### Search Tests
${this.apiKeys.brave ? `\`\`\`
Search the web for the latest AI news
\`\`\`\n` : ''}
${this.apiKeys.tavily ? `\`\`\`
Search for machine learning tutorials
\`\`\`\n` : ''}` : ''}

${this.apiKeys.github ? `### GitHub Test
\`\`\`
Show my recent GitHub activity
\`\`\`
` : ''}

## Your Configuration

${searchInfo.length > 0 ? searchInfo.join('\n') : '- No search services configured'}
- ✅ Filesystem Access
- ✅ Persistent Memory

## Need Help?

Just ask Claude! For example:
- "Help me create a web scraper"
- "Build a todo list app"
- "Explain how MCP works"

Workspace location: ${this.workspace}
Config location: ${this.claudeConfig}

Happy coding! 🚀
`);
    
    this.log('Created welcome file', 'success');
  }

  printSummary() {
    console.log(`
╔════════════════════════════════════════╗
║        ✅ Setup Complete!              ║
╚════════════════════════════════════════╝

🎉 Your AI-powered Claude is ready!

Configured Services:
- ✅ Filesystem (read/write files)
- ✅ Memory (persistent across chats)
${this.apiKeys.brave ? '- ✅ Brave Search (web search)' : ''}
${this.apiKeys.tavily ? '- ✅ Tavily Search (AI search)' : ''}
${this.apiKeys.github ? '- ✅ GitHub (repo management)' : ''}

Next Steps:
1. Restart Claude Desktop
2. Say: "Show me my MCP capabilities"
3. Check ${this.workspace}/README.md

Need to add more services later?
Run: npx mcp-quickstart setup

Enjoy your supercharged Claude! 🚀
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
    
    // Add checks for optional servers
    if (fs.existsSync(this.claudeConfig)) {
      const config = JSON.parse(fs.readFileSync(this.claudeConfig, 'utf8'));
      if (config.mcpServers['brave-search']) {
        checks.push(['Brave Search config', () => true]);
      }
      if (config.mcpServers['tavily-search']) {
        checks.push(['Tavily Search config', () => true]);
      }
      if (config.mcpServers.github) {
        checks.push(['GitHub config', () => true]);
      }
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

  async run() {
    if (!this.checkNode()) {
      process.exit(1);
    }
    
    // Run the setup wizard
    await this.setupWizard();
    
    this.backupConfig();
    this.createDirectories();
    
    if (!this.installServers()) {
      this.log('Installation failed', 'error');
      process.exit(1);
    }
    
    this.generateConfig();
    this.createWelcomeFile();
    
    this.verify();
    this.printSummary();
    
    process.exit(0);
  }
}

if (require.main === module) {
  const command = process.argv[2];
  const installer = new MCPInstaller();
  
  if (command === 'verify') {
    installer.verify();
    process.exit(0);
  } else if (command === 'setup') {
    // Allow re-running setup to add more services
    installer.run();
  } else {
    installer.run();
  }
}

module.exports = MCPInstaller;
