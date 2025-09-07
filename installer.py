#!/usr/bin/env python3
"""
MCP Quickstart - Simplified Production Installer
Minimal dependencies, maximum reliability
"""

import os
import sys
import json
import subprocess
import platform
import shutil
from pathlib import Path
import time
import argparse

class MCPInstaller:
    """Simplified MCP installer - production ready"""
    
    def __init__(self):
        self.os_type = platform.system()
        self.home = Path.home()
        self.mcp_dir = self.home / ".mcp-servers"
        self.workspace = self.home / "claude-mcp-workspace"
        
        # Claude config location by OS
        if self.os_type == "Darwin":
            self.claude_config = self.home / "Library/Application Support/Claude/claude_desktop_config.json"
        elif self.os_type == "Windows":
            self.claude_config = Path(os.environ.get("APPDATA", "")) / "Claude/claude_desktop_config.json"
        else:
            self.claude_config = self.home / ".config/claude/claude_desktop_config.json"
        
        self.errors = []
        
    def log(self, message, level="INFO"):
        """Simple logging with colors if terminal supports it"""
        if sys.stdout.isatty():
            colors = {"ERROR": "31", "SUCCESS": "32", "INFO": "34"}
            color = colors.get(level, "0")
            print(f"\033[{color}m[{level}] {message}\033[0m")
        else:
            print(f"[{level}] {message}")
        
        if level == "ERROR":
            self.errors.append(message)
    
    def check_node(self):
        """Check if Node.js is installed"""
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def backup_config(self):
        """Backup existing configuration if it exists"""
        if self.claude_config.exists():
            backup = self.claude_config.parent / f"claude_config_backup_{int(time.time())}.json"
            shutil.copy2(self.claude_config, backup)
            self.log(f"Backed up config to {backup.name}", "INFO")
    
    def install_servers(self):
        """Install core MCP servers only"""
        # Essential servers only - removed optional ones
        servers = [
            "@modelcontextprotocol/server-filesystem",
            "@modelcontextprotocol/server-github",
            "@modelcontextprotocol/server-brave-search",
            "@modelcontextprotocol/server-memory"
        ]
        
        # Create MCP directory
        self.mcp_dir.mkdir(parents=True, exist_ok=True)
        
        # Save current directory
        original_dir = Path.cwd()
        
        try:
            os.chdir(self.mcp_dir)
            
            # Initialize package.json if needed
            if not (self.mcp_dir / "package.json").exists():
                subprocess.run(["npm", "init", "-y"], capture_output=True)
            
            # Install servers
            installed = []
            for server in servers:
                self.log(f"Installing {server.split('/')[-1]}...")
                result = subprocess.run(
                    ["npm", "install", server],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    installed.append(server.split('/')[-1])
                    self.log(f"Installed {server.split('/')[-1]}", "SUCCESS")
                else:
                    self.log(f"Failed to install {server}", "ERROR")
            
            return installed
            
        finally:
            os.chdir(original_dir)  # Always restore directory
    
    def detect_api_keys(self):
        """Simple API key detection from environment"""
        return {
            "github": os.environ.get("GITHUB_TOKEN", "REPLACE_WITH_GITHUB_TOKEN"),
            "brave": os.environ.get("BRAVE_API_KEY", "REPLACE_WITH_BRAVE_KEY")
        }
    
    def generate_config(self, installed_servers):
        """Generate minimal Claude configuration"""
        keys = self.detect_api_keys()
        
        config = {"mcpServers": {}}
        
        # Only add successfully installed servers
        if "server-filesystem" in installed_servers:
            config["mcpServers"]["filesystem"] = {
                "command": "node",
                "args": [
                    str(self.mcp_dir / "node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"),
                    str(self.workspace)
                ]
            }
        
        if "server-github" in installed_servers:
            config["mcpServers"]["github"] = {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-github"],
                "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": keys["github"]}
            }
        
        if "server-brave-search" in installed_servers:
            config["mcpServers"]["brave-search"] = {
                "command": "npx",
                "args": ["-y", "@modelcontextprotocol/server-brave-search"],
                "env": {"BRAVE_API_KEY": keys["brave"]}
            }
        
        if "server-memory" in installed_servers:
            config["mcpServers"]["memory"] = {
                "command": "node",
                "args": [
                    str(self.mcp_dir / "node_modules/@modelcontextprotocol/server-memory/dist/index.js")
                ]
            }
        
        return config
    
    def write_config(self, config):
        """Write configuration to Claude config file"""
        self.claude_config.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.claude_config, 'w') as f:
            json.dump(config, f, indent=2)
        
        self.log(f"Configuration written to {self.claude_config}", "SUCCESS")
    
    def create_workspace(self):
        """Create minimal workspace structure"""
        self.workspace.mkdir(parents=True, exist_ok=True)
        
        # Simple test file
        test_file = self.workspace / "test-mcp.txt"
        test_file.write_text("""MCP Test Commands:

1. List files in workspace
2. Search for "AI news"  
3. Remember: "Setup complete"

If these work, your MCP is ready!
""")
        
        self.log(f"Created workspace at {self.workspace}", "SUCCESS")
    
    def run(self):
        """Main installation flow"""
        print("\nMCP Quickstart Installer")
        print("=" * 40)
        
        # Check Node.js
        if not self.check_node():
            self.log("Node.js is required. Please install from https://nodejs.org", "ERROR")
            return False
        
        self.log("Node.js found", "SUCCESS")
        
        # Backup existing config
        self.backup_config()
        
        # Install servers
        self.log("Installing MCP servers...")
        installed = self.install_servers()
        
        if not installed:
            self.log("No servers installed successfully", "ERROR")
            return False
        
        # Generate and write config
        self.log("Generating configuration...")
        config = self.generate_config(installed)
        self.write_config(config)
        
        # Create workspace
        self.create_workspace()
        
        # Final report
        print("\n" + "=" * 40)
        if self.errors:
            print(f"⚠️  Completed with {len(self.errors)} errors")
            for error in self.errors[:3]:
                print(f"  - {error}")
        else:
            print("✅ Setup Complete!")
        
        print(f"""
Installed: {len(installed)} servers
Config: {self.claude_config}
Workspace: {self.workspace}

Next steps:
1. Add API keys to config if needed
2. Restart Claude Desktop
3. Test with: "Show me my MCP capabilities"
""")
        
        return len(self.errors) == 0

def main():
    parser = argparse.ArgumentParser(description="MCP Quickstart Installer")
    parser.add_argument("--test", action="store_true", help="Test mode")
    args = parser.parse_args()
    
    if args.test:
        print("Test mode: Would install MCP servers")
        return 0
    
    installer = MCPInstaller()
    success = installer.run()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
