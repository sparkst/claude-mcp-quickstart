#!/usr/bin/env node

/**
 * MCP Quickstart - One-Command Web Installer
 * Run: npx mcp-quickstart
 */

const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/yourusername/mcp-quickstart/main/install.sh';
const INSTALL_SCRIPT_WIN = 'https://raw.githubusercontent.com/yourusername/mcp-quickstart/main/install.ps1';

class MCPInstaller {
    constructor() {
        this.platform = os.platform();
        this.homeDir = os.homedir();
    }

    async run() {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║              MCP QUICKSTART - NPX INSTALLER           ║
║                   Zero Config Setup                   ║
╚═══════════════════════════════════════════════════════╝
        `);

        try {
            if (this.platform === 'win32') {
                await this.installWindows();
            } else {
                await this.installUnix();
            }
        } catch (error) {
            console.error('Installation failed:', error.message);
            process.exit(1);
        }
    }

    async downloadScript(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(data));
                response.on('error', reject);
            }).on('error', reject);
        });
    }

    async installUnix() {
        console.log('Downloading installer for Unix/Mac...');
        const script = await this.downloadScript(INSTALL_SCRIPT_URL);
        
        const tempScript = path.join(os.tmpdir(), 'mcp-install.sh');
        fs.writeFileSync(tempScript, script);
        fs.chmodSync(tempScript, '755');
        
        console.log('Running installer...');
        exec(`bash ${tempScript}`, (error, stdout, stderr) => {
            console.log(stdout);
            if (error) {
                console.error(stderr);
                process.exit(1);
            }
            fs.unlinkSync(tempScript);
            console.log('Installation complete!');
        });
    }

    async installWindows() {
        console.log('Downloading installer for Windows...');
        const script = await this.downloadScript(INSTALL_SCRIPT_WIN);
        
        const tempScript = path.join(os.tmpdir(), 'mcp-install.ps1');
        fs.writeFileSync(tempScript, script);
        
        console.log('Running installer (requires PowerShell)...');
        exec(`powershell -ExecutionPolicy Bypass -File ${tempScript}`, (error, stdout, stderr) => {
            console.log(stdout);
            if (error) {
                console.error(stderr);
                process.exit(1);
            }
            fs.unlinkSync(tempScript);
            console.log('Installation complete!');
        });
    }
}

// Auto-run when executed
if (require.main === module) {
    const installer = new MCPInstaller();
    installer.run();
}

module.exports = MCPInstaller;
